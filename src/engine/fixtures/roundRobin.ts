import type { Rng } from '@/engine/rng';
import type { Bye, Fixture, RoundRobinSchedule } from './types';

// Internal marker for the odd-team-out placeholder in the circle method
// below. Never appears in the schedule the caller sees.
const BYE = Symbol('bye');
type Slot<TeamId> = TeamId | typeof BYE;

interface Pairing<TeamId> {
  matchday: number;
  a: Slot<TeamId>;
  b: Slot<TeamId>;
}

/**
 * Generates a two-way (home-and-away) round-robin schedule for N teams,
 * per MVP1 spec §1 "Fixtures". The pairings and the home and away sides
 * are not stochastic: the same team list and order always give the same
 * fixtures.
 *
 * `rng` is optional, and only shuffles the order of the matches inside
 * each matchday (Task 30). Without the shuffle, the circle method keeps
 * the first team in the first match of every matchday. Without an `rng`,
 * the order is the circle method's, the same on every call (see the
 * determinism test).
 *
 * Not in scope here: single-duels round robin's randomized-but-balanced
 * home/away assignment. That is MVP2's `groups round robin`, a separate
 * generator, not an extension of this one.
 */
export function generateRoundRobin<TeamId>(teams: readonly TeamId[], rng?: Rng): RoundRobinSchedule<TeamId> {
  if (teams.length < 2) {
    throw new RangeError(
      `generateRoundRobin needs at least 2 teams, got ${teams.length}. This is a deliberate rejection, not a spec rule — see the Task 3 decision log.`
    );
  }

  const hasBye = teams.length % 2 !== 0;
  const slots: Slot<TeamId>[] = hasBye ? [...teams, BYE] : [...teams];
  const slotCount = slots.length;
  const roundsPerLeg = slotCount - 1;
  const half = slotCount / 2;

  const legOnePairings = pairLegOne(slots, roundsPerLeg, half);

  const fixtures: Fixture<TeamId>[] = [];
  const byes: Bye<TeamId>[] = [];

  for (const pairing of legOnePairings) {
    addLegOne(pairing, fixtures, byes);
  }
  for (const pairing of legOnePairings) {
    addLegTwo(pairing, roundsPerLeg, fixtures, byes);
  }

  return { fixtures: rng ? shuffleWithinMatchdays(fixtures, rng) : fixtures, byes };
}

// `fixtures` arrives in matchday order. Fisher-Yates on each matchday's run
// of fixtures, so the matchday order stays and only the match order moves.
function shuffleWithinMatchdays<T extends { matchday: number }>(fixtures: T[], rng: Rng): T[] {
  const shuffled = fixtures.slice();
  let start = 0;
  while (start < shuffled.length) {
    let end = start;
    while (end < shuffled.length && shuffled[end].matchday === shuffled[start].matchday) end++;
    for (let i = end - 1; i > start; i--) {
      const j = start + Math.floor(rng() * (i - start + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    start = end;
  }
  return shuffled;
}

function pairLegOne<TeamId>(
  slots: readonly Slot<TeamId>[],
  roundsPerLeg: number,
  half: number
): Pairing<TeamId>[] {
  const pairings: Pairing<TeamId>[] = [];
  const rotating = slots.slice();

  for (let round = 0; round < roundsPerLeg; round++) {
    for (let i = 0; i < half; i++) {
      pairings.push({ matchday: round + 1, a: rotating[i], b: rotating[rotating.length - 1 - i] });
    }
    rotateKeepingFirstFixed(rotating);
  }

  return pairings;
}

// Classic round-robin "circle method": the first slot stays put, every
// other slot advances one position, with the last wrapping to the front.
function rotateKeepingFirstFixed<T>(slots: T[]): void {
  const last = slots.pop();
  if (last !== undefined) slots.splice(1, 0, last);
}

function addLegOne<TeamId>(pairing: Pairing<TeamId>, fixtures: Fixture<TeamId>[], byes: Bye<TeamId>[]): void {
  const { matchday, a, b } = pairing;
  if (a === BYE || b === BYE) {
    byes.push({ matchday, team: (a === BYE ? b : a) as TeamId });
    return;
  }
  // Alternate which side of the pairing is home by round, so a fixed
  // anchor team is not home every round of the first leg.
  const homeIsB = matchday % 2 === 0;
  fixtures.push(homeIsB ? { matchday, home: b, away: a } : { matchday, home: a, away: b });
}

function addLegTwo<TeamId>(
  pairing: Pairing<TeamId>,
  roundsPerLeg: number,
  fixtures: Fixture<TeamId>[],
  byes: Bye<TeamId>[]
): void {
  const { matchday, a, b } = pairing;
  const legTwoMatchday = matchday + roundsPerLeg;
  if (a === BYE || b === BYE) {
    byes.push({ matchday: legTwoMatchday, team: (a === BYE ? b : a) as TeamId });
    return;
  }
  // Same pairing as leg one, home and away swapped.
  const homeIsB = matchday % 2 === 0;
  fixtures.push(
    homeIsB
      ? { matchday: legTwoMatchday, home: a, away: b }
      : { matchday: legTwoMatchday, home: b, away: a }
  );
}
