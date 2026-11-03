import type { Rng } from '@/engine/rng';
import type { Bye } from './types';

/**
 * One pairing of the circle method, before the home and away pick. `a` and
 * `b` are two teams that meet on `matchday`. Their order carries no home or
 * away meaning: each generator picks the sides itself.
 */
export interface Pairing<TeamId> {
  matchday: number;
  a: TeamId;
  b: TeamId;
}

export interface CirclePairings<TeamId> {
  pairings: Pairing<TeamId>[];
  byes: Bye<TeamId>[];
}

// Internal marker for the odd-team-out placeholder. Never leaves this file.
const BYE = Symbol('bye');
type Slot<TeamId> = TeamId | typeof BYE;

/**
 * Pairs each team with each other team once, by the classic circle method
 * (Task 82). An odd team count gets a bye slot, so each matchday has one
 * bye. That gives N - 1 matchdays for an even N, and N for an odd N. The
 * pairings follow the team order: the same list always gives the same
 * pairings. `generateRoundRobin` and `generateSingleDuels` share it.
 *
 * The pairings come in matchday order, and the first team stays in the
 * first pairing of each matchday.
 */
export function pairByCircle<TeamId>(teams: readonly TeamId[]): CirclePairings<TeamId> {
  const rotating: Slot<TeamId>[] =
    teams.length % 2 === 0 ? [...teams] : [...teams, BYE];
  const matchdayCount = rotating.length - 1;
  const half = rotating.length / 2;

  const pairings: Pairing<TeamId>[] = [];
  const byes: Bye<TeamId>[] = [];

  for (let matchday = 1; matchday <= matchdayCount; matchday++) {
    for (let i = 0; i < half; i++) {
      const a = rotating[i];
      const b = rotating[rotating.length - 1 - i];
      if (a === BYE || b === BYE) {
        byes.push({ matchday, team: (a === BYE ? b : a) as TeamId });
      } else {
        pairings.push({ matchday, a, b });
      }
    }
    rotateKeepingFirstFixed(rotating);
  }

  return { pairings, byes };
}

// The circle method step: the first slot stays put, every other slot
// advances one position, with the last wrapping to the front.
function rotateKeepingFirstFixed<T>(slots: T[]): void {
  const last = slots.pop();
  if (last !== undefined) slots.splice(1, 0, last);
}

/**
 * Shuffles the match order inside each matchday (Task 30). `fixtures`
 * arrives in matchday order. Fisher-Yates on each matchday's run of
 * fixtures, so the matchday order stays and only the match order moves.
 * The input does not change.
 */
export function shuffleWithinMatchdays<T extends { matchday: number }>(
  fixtures: readonly T[],
  rng: Rng
): T[] {
  const shuffled = fixtures.slice();
  let start = 0;
  while (start < shuffled.length) {
    let end = start;
    while (end < shuffled.length && shuffled[end].matchday === shuffled[start].matchday)
      end++;
    for (let i = end - 1; i > start; i--) {
      const j = start + Math.floor(rng() * (i - start + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    start = end;
  }
  return shuffled;
}
