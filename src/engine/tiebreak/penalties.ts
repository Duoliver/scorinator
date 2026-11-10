import type { Rng } from '@/engine/rng';
import type { MatchScore } from '@/engine/scorination';
import { CoinSide } from './types';

/**
 * The penalty model of Task 80: about 75% of kicks score in real football,
 * and a shootout is close to a coin toss, with a small edge for the
 * stronger team. A gap of 60 OVR gives that team about 70% of shootouts.
 */
export const PENALTY_KICK_BASE = 0.75;
export const PENALTY_KICK_WEIGHT = 0.1;
export const PENALTY_KICK_MIN = 0.6;
export const PENALTY_KICK_MAX = 0.9;

/** The kicks each team takes before sudden death. */
export const PENALTY_ROUNDS = 5;

/** The chance that one kick scores, from the stored OVRs of the two teams. */
export function computeKickChance(ownOvr: number, opponentOvr: number): number {
  const chance =
    PENALTY_KICK_BASE + (PENALTY_KICK_WEIGHT * (ownOvr - opponentOvr)) / 100;
  return Math.min(PENALTY_KICK_MAX, Math.max(PENALTY_KICK_MIN, chance));
}

interface Kicker {
  chance: number;
  goals: number;
  kicks: number;
}

// One team cannot catch up when its goals plus its kicks left in the five
// rounds stay below the goals of the other team.
function isShootoutDecided(first: Kicker, second: Kicker): boolean {
  const canReach = (team: Kicker, other: Kicker): boolean =>
    team.goals + (PENALTY_ROUNDS - team.kicks) >= other.goals;
  return !canReach(first, second) || !canReach(second, first);
}

function kick(kicker: Kicker, rng: Rng): void {
  kicker.kicks++;
  if (rng() < kicker.chance) kicker.goals++;
}

/**
 * Plays a penalty shootout kick by kick (US-03.3). The `Rng` picks the team
 * that kicks first, 50/50, and kicking first gives no edge. Five kicks each,
 * in turn, until one team cannot catch up. If still level, the teams kick
 * in pairs until one pair has a winner. Give the stored OVRs: a shootout has
 * no home boost (Task 80). The score is never level.
 */
export function scorinatePenalties(
  homeOvr: number,
  awayOvr: number,
  rng: Rng
): MatchScore {
  const home: Kicker = {
    chance: computeKickChance(homeOvr, awayOvr),
    goals: 0,
    kicks: 0,
  };
  const away: Kicker = {
    chance: computeKickChance(awayOvr, homeOvr),
    goals: 0,
    kicks: 0,
  };
  const [first, second] = rng() < 0.5 ? [home, away] : [away, home];

  for (let round = 0; round < PENALTY_ROUNDS; round++) {
    kick(first, rng);
    if (isShootoutDecided(first, second)) break;
    kick(second, rng);
    if (isShootoutDecided(first, second)) break;
  }
  while (first.goals === second.goals) {
    kick(first, rng);
    kick(second, rng);
  }
  return { homeGoals: home.goals, awayGoals: away.goals };
}

/** A pure 50/50 coin toss (US-03.3). Team strength plays no part. */
export function tossCoin(rng: Rng): CoinSide {
  return rng() < 0.5 ? CoinSide.HOME : CoinSide.AWAY;
}
