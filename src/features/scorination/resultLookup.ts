import type { Fixture } from '@/engine/fixtures';
import type { LeagueRecord, LeagueResult } from '@/features/leagues/types';

/** The result already recorded for one fixture, if it has been
 * scorinated — matched on the `(matchday, home, away)` triple, which
 * `generateRoundRobin` guarantees is unique per league. */
export function findResult(
  league: LeagueRecord,
  fixture: Fixture<string>
): LeagueResult | undefined {
  return league.results.find(
    (result) =>
      result.matchday === fixture.matchday &&
      result.home === fixture.home &&
      result.away === fixture.away
  );
}

/** True once every fixture scheduled for `matchday` has a result — used
 * to disable a "Scorinate matchday" action once there is nothing left to
 * play that day. A matchday with no fixtures at all (an empty schedule)
 * counts as fully played, since there is nothing to scorinate either
 * way. */
export function isMatchdayFullyPlayed(league: LeagueRecord, matchday: number): boolean {
  return league.fixtures
    .filter((fixture) => fixture.matchday === matchday)
    .every((fixture) => findResult(league, fixture) !== undefined);
}
