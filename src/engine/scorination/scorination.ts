import type { Rng } from '../rng';
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
export function computeExpectedGoals(ownOvr: number, opponentOvr: number, elasticity: number): number {
  const diffFactor = clamp(1 + (DIFF_WEIGHT * (ownOvr - opponentOvr)) / 100, DIFF_FACTOR_MIN, DIFF_FACTOR_MAX);
  const absFactor = clamp(1 + (ABS_WEIGHT * (ownOvr - REFERENCE_OVR)) / 100, ABS_FACTOR_MIN, ABS_FACTOR_MAX);
  return Math.max(MIN_EXPECTED_GOALS, BASE_GOALS_PER_TEAM * diffFactor * absFactor * elasticity);
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
 * Generates one match's final score. OVR difference primarily sets the
 * margin, absolute OVR gives a smaller secondary pull, and one shared
 * elasticity roll scales both teams' goal volume up or down without
 * touching the relative split OVR already set (spec §1). This feeds a
 * Poisson draw per team, so a stronger team is favored, not guaranteed.
 *
 * Home advantage (Task 6) is not applied here — pass an already-boosted
 * `homeOvr` for a league that has it enabled.
 */
export function scorinateMatch(homeOvr: number, awayOvr: number, rng: Rng): MatchScore {
  const elasticity = rollElasticity(rng);
  const homeGoals = samplePoisson(computeExpectedGoals(homeOvr, awayOvr, elasticity), rng);
  const awayGoals = samplePoisson(computeExpectedGoals(awayOvr, homeOvr, elasticity), rng);
  return { homeGoals, awayGoals };
}
