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

/** The first matchday with a fixture that has no result yet — the next
 * one to play. `undefined` once every fixture has a result, which is how
 * a caller tells a completed league apart, and also for a league with no
 * fixtures at all. Matchdays are checked in order, not by play order, so
 * a matchday skipped earlier is still the current one. */
export function findCurrentMatchday(league: LeagueRecord): number | undefined {
  const unplayed = league.fixtures
    .filter((fixture) => findResult(league, fixture) === undefined)
    .map((fixture) => fixture.matchday);
  return unplayed.length === 0 ? undefined : Math.min(...unplayed);
}
