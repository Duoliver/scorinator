import type { Rng } from '@/engine/rng';
import type { MatchScore } from './types';

/**
 * MVP1 spec §1 "Scorination Engine": league-wide average sits around 1.3
 * goals per team. This is the expected-goals value before OVR and
 * elasticity move it up or down.
 */
export const BASE_GOALS_PER_TEAM = 1.3;

/**
 * Midpoint of the full Tier -> OVR span (30-99, see `engine/tier-ovr`).
 * Absolute OVR is measured against this point: above it nudges expected
 * goals up, below it nudges them down.
 */
export const REFERENCE_OVR = 65;

/**
 * Relative weight of OVR difference vs. absolute OVR in the expected-goals
 * blend below. The spec names OVR difference the primary driver of margin
 * and absolute OVR a smaller, secondary influence, without an exact ratio
 * — flagged per CLAUDE.md's open-items list rather than picked silently.
 * The user confirmed a 5:1 ratio, difference dominant, for this task. See
 * the Task 5 decision log for the full reasoning.
 */
export const DIFF_WEIGHT = 1.5;
export const ABS_WEIGHT = 0.3;

// Keeps a very large OVR mismatch from driving expected goals to zero (or
// below) or to an implausible extreme — an upset stays possible either way.
const DIFF_FACTOR_MIN = 0.15;
const DIFF_FACTOR_MAX = 4;
const ABS_FACTOR_MIN = 0.5;
const ABS_FACTOR_MAX = 2;

/**
 * Match elasticity range (spec §1): a single "openness" value, rolled once
 * per match and applied to both teams equally. Uniform across this range,
 * mean 1.0, so it does not shift the league-wide average by itself — only
 * how open or shut any one match plays.
 */
export const ELASTICITY_MIN = 0.4;
export const ELASTICITY_MAX = 1.6;

// A Poisson mean of 0 never scores; a small positive floor keeps a heavy
// mismatch scoreable, however rarely, instead of impossible.
const MIN_EXPECTED_GOALS = 0.05;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Rolls one match's shared elasticity value. */
export function rollElasticity(rng: Rng): number {
  return ELASTICITY_MIN + rng() * (ELASTICITY_MAX - ELASTICITY_MIN);
}

/**
 * Expected goals (a Poisson mean) for one team, from its own OVR, its
 * opponent's OVR, and the match's shared elasticity roll. Not itself
 * stochastic — every random decision (elasticity, the final score) happens
 * around this function, not inside it, so the blend itself stays a plain
 * unit-testable calculation.
 */
export function computeExpectedGoals(
  ownOvr: number,
  opponentOvr: number,
  elasticity: number
): number {
  const diffFactor = clamp(
    1 + (DIFF_WEIGHT * (ownOvr - opponentOvr)) / 100,
    DIFF_FACTOR_MIN,
    DIFF_FACTOR_MAX
  );
  const absFactor = clamp(
    1 + (ABS_WEIGHT * (ownOvr - REFERENCE_OVR)) / 100,
    ABS_FACTOR_MIN,
    ABS_FACTOR_MAX
  );
  return Math.max(
    MIN_EXPECTED_GOALS,
    BASE_GOALS_PER_TEAM * diffFactor * absFactor * elasticity
  );
}

// Knuth's algorithm: multiply uniform draws until the running product drops
// at or below e^-lambda, and count how many draws that took.
function samplePoisson(lambda: number, rng: Rng): number {
  const limit = Math.exp(-lambda);
  let product = 1;
  let goals = -1;
  do {
    goals++;
    product *= rng();
  } while (product > limit);
  return goals;
}

/**
 * League-level home-advantage boost (MVP1 spec §1): a league that enables
 * it gives the home team an OVR boost with two parts, for that match only —
 * the team's stored OVR never changes.
 *
 * - The flat part is the same for every team: pitch familiarity, and the
 *   travel fatigue of the away team.
 * - The percentage part grows with team strength: crowd size, since a
 *   stronger team usually has a bigger stadium.
 *
 * The user chose +5 and 5% (Task 32). Measured with this engine, two equal
 * teams then give a home win gap of about +13, +16, and +21 points at OVR
 * 35, 65, and 95. Real football is about +16. Before Task 32 the boost was
 * 5% only, which gave about +6 at OVR 65.
 */
export const HOME_ADVANTAGE_FLAT = 5;
export const HOME_ADVANTAGE_PERCENT = 0.05;

/**
 * Applies the home-advantage boost to one OVR value: the percentage part
 * first, rounded back to a whole number (OVR is always an integer, see
 * `engine/tier-ovr`), then the flat part. The result can go above 99. A
 * league with home advantage enabled calls this on the home team's OVR
 * before it reaches `scorinateMatch`; a league without it skips the call
 * entirely — this function carries no on/off state of its own. MVP2's
 * single-duels format uses the same boost rule (spec §2).
 */
export function applyHomeAdvantage(ovr: number): number {
  return Math.round(ovr * (1 + HOME_ADVANTAGE_PERCENT)) + HOME_ADVANTAGE_FLAT;
}

/**
 * Extra time (AET) is 30 minutes, so a third of a 90-minute match. The AET
 * of a drawn match plays at this share of the match expected goals, with
 * the elasticity of the match, because it is the same match (Task 80).
 */
export const AET_TIME_SHARE = 1 / 3;

/**
 * Draws one score for a part of a match: `timeShare` scales the expected
 * goals of a full match, so 1 is 90 minutes and `AET_TIME_SHARE` is extra
 * time. The caller gives the elasticity, so the AET of a bracket tie can
 * re-use the roll of its match. The home goals draw first, then the away
 * goals: `scorinateMatch` depends on this order to keep seeded runs the same.
 */
export function scorinatePeriod(
  homeOvr: number,
  awayOvr: number,
  elasticity: number,
  timeShare: number,
  rng: Rng
): MatchScore {
  const homeGoals = samplePoisson(
    computeExpectedGoals(homeOvr, awayOvr, elasticity) * timeShare,
    rng
  );
  const awayGoals = samplePoisson(
    computeExpectedGoals(awayOvr, homeOvr, elasticity) * timeShare,
    rng
  );
  return { homeGoals, awayGoals };
}

/**
 * Generates one match's final score. OVR difference primarily sets the
 * margin, absolute OVR gives a smaller secondary pull, and one shared
 * elasticity roll scales both teams' goal volume up or down without
 * touching the relative split OVR already set (spec §1). This feeds a
 * Poisson draw per team, so a stronger team is favored, not guaranteed.
 *
 * Home advantage is not applied here — pass `homeOvr` through
 * `applyHomeAdvantage` first for a league that has it enabled.
 */
export function scorinateMatch(homeOvr: number, awayOvr: number, rng: Rng): MatchScore {
  return scorinatePeriod(homeOvr, awayOvr, rollElasticity(rng), 1, rng);
}

/**
 * Generates the goals of extra time only, not the match score plus AET.
 * The bracket adds them to the match score, and keeps the two apart for a
 * later display of the score before AET (future features §22). Give the
 * elasticity of the drawn match. As for a match, the caller applies the home
 * boost: a single-match tie is neutral, and the AET of a second leg keeps
 * the boost of its home team (Task 80).
 */
export function scorinateExtraTime(
  homeOvr: number,
  awayOvr: number,
  elasticity: number,
  rng: Rng
): MatchScore {
  return scorinatePeriod(homeOvr, awayOvr, elasticity, AET_TIME_SHARE, rng);
}

/**
 * Plays one match of a league: applies the home-advantage boost when the
 * league has it on, then scorinates. A round-robin or Groups match plays
 * this way, and so does a leg of a tie that cannot go to AET.
 * A bracket tie that can go to AET calls `rollElasticity` and
 * `scorinatePeriod` itself, because its AET needs the elasticity roll.
 */
export function playMatch(
  homeOvr: number,
  awayOvr: number,
  homeAdvantage: boolean,
  rng: Rng
): MatchScore {
  const boostedHomeOvr = homeAdvantage ? applyHomeAdvantage(homeOvr) : homeOvr;
  return scorinateMatch(boostedHomeOvr, awayOvr, rng);
}
