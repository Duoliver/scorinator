import type { Fixture, MatchIdentity } from './types';

/**
 * Lookups over a round-robin schedule and its results. A round robin gives
 * each `(matchday, home, away)` exactly one fixture, so these three fields
 * identify a match. A bracket does not work this way (two legs, replays), so
 * it needs its own lookups.
 *
 * Each function takes plain arrays, not a league record, so the engine does
 * not depend on how the app stores a league. Pass the fixtures and results
 * of one schedule only.
 */

export function isSameMatch<TeamId>(
  a: MatchIdentity<TeamId>,
  b: MatchIdentity<TeamId>
): boolean {
  return a.matchday === b.matchday && a.home === b.home && a.away === b.away;
}

/** A text key for a `Map` or a `Set`. JSON, not a joined string: slugs hold
 * hyphens, so `fc` + `a-b` and `fc-a` + `b` must not give the same key. */
export function matchKey<TeamId>(match: MatchIdentity<TeamId>): string {
  return JSON.stringify([match.matchday, match.home, match.away]);
}

export function findResult<TeamId, Result extends MatchIdentity<TeamId>>(
  results: readonly Result[],
  match: MatchIdentity<TeamId>
): Result | undefined {
  return results.find((result) => isSameMatch(result, match));
}

/** True once every fixture of `matchday` has a result. A matchday with no
 * fixtures counts as fully played, since nothing is left to play. */
export function isMatchdayFullyPlayed<TeamId>(
  fixtures: readonly Fixture<TeamId>[],
  results: readonly MatchIdentity<TeamId>[],
  matchday: number
): boolean {
  return fixtures
    .filter((fixture) => fixture.matchday === matchday)
    .every((fixture) => findResult(results, fixture) !== undefined);
}

/** The lowest matchday with a fixture that has no result: the next one to
 * play. A matchday skipped earlier is still the current one. `undefined`
 * when every fixture has a result, or when there are no fixtures. */
export function findCurrentMatchday<TeamId>(
  fixtures: readonly Fixture<TeamId>[],
  results: readonly MatchIdentity<TeamId>[]
): number | undefined {
  const unplayed = fixtures
    .filter((fixture) => findResult(results, fixture) === undefined)
    .map((fixture) => fixture.matchday);
  return unplayed.length === 0 ? undefined : Math.min(...unplayed);
}
