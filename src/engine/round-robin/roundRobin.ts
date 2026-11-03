import type { Rng } from '@/engine/rng';
import { pairByCircle, shuffleWithinMatchdays } from './circlePairing';
import type { Bye, Fixture, RoundRobinSchedule } from './types';

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
 * Single duels is `generateSingleDuels`, a separate generator that shares
 * the pairing step (Task 82).
 */
export function generateRoundRobin<TeamId>(
  teams: readonly TeamId[],
  rng?: Rng
): RoundRobinSchedule<TeamId> {
  if (teams.length < 2) {
    throw new RangeError(
      `generateRoundRobin needs at least 2 teams, got ${teams.length}. This is a deliberate rejection, not a spec rule — see the Task 3 decision log.`
    );
  }

  const legOne = pairByCircle(teams);
  const matchdaysPerLeg = teams.length % 2 === 0 ? teams.length - 1 : teams.length;

  const fixtures: Fixture<TeamId>[] = [];
  for (const { matchday, a, b } of legOne.pairings) {
    // Alternate which side of the pairing is home by round, so a fixed
    // anchor team is not home every round of the first leg.
    const homeIsB = matchday % 2 === 0;
    fixtures.push(
      homeIsB ? { matchday, home: b, away: a } : { matchday, home: a, away: b }
    );
  }
  for (const { matchday, a, b } of legOne.pairings) {
    // Same pairing as leg one, home and away swapped.
    const homeIsB = matchday % 2 === 0;
    const legTwoMatchday = matchday + matchdaysPerLeg;
    fixtures.push(
      homeIsB
        ? { matchday: legTwoMatchday, home: a, away: b }
        : { matchday: legTwoMatchday, home: b, away: a }
    );
  }

  const byes: Bye<TeamId>[] = [
    ...legOne.byes,
    ...legOne.byes.map(({ matchday, team }) => ({
      matchday: matchday + matchdaysPerLeg,
      team,
    })),
  ];

  return { fixtures: rng ? shuffleWithinMatchdays(fixtures, rng) : fixtures, byes };
}
