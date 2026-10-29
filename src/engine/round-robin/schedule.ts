import type { Fixture, MatchIdentity, PhaseFixture } from './types';

/**
 * Lookups over a round-robin schedule and its results. A round robin gives
 * each `(matchday, home, away)` exactly one fixture, so these three fields
 * identify a match. A bracket does not work this way (two legs, replays), so
 * it needs its own lookups.
 *
 * Each function takes plain arrays, not a league record, so the engine does
 * not depend on how the app stores a league. Pass the fixtures and results
 * of one schedule only.
 *
 * In MVP2 the triple no longer names one match: matchdays start again in
 * each phase, and groups share them. The `Phase` lookups at the end of this
 * file find a result by its fixture id instead (Task 77, Task 105). The
 * triple lookups stay for the MVP1 screens until Task 109.
 */

/** @deprecated MVP1 triple lookup. Compare `fixture.id` with
 * `result.fixtureId` in new code. Task 109 removes it. */
export function isSameMatch<TeamId>(
  a: MatchIdentity<TeamId>,
  b: MatchIdentity<TeamId>
): boolean {
  return a.matchday === b.matchday && a.home === b.home && a.away === b.away;
}

/** A text key for a `Map` or a `Set`. JSON, not a joined string: slugs hold
 * hyphens, so `fc` + `a-b` and `fc-a` + `b` must not give the same key.
 *
 * @deprecated MVP1 triple lookup. Use the fixture id as the key in new code.
 * Task 109 removes it.
 */
export function matchKey<TeamId>(match: MatchIdentity<TeamId>): string {
  return JSON.stringify([match.matchday, match.home, match.away]);
}

/** @deprecated MVP1 triple lookup. Use `findPhaseResult` in new code. Task 109
 * removes it. */
export function findResult<TeamId, Result extends MatchIdentity<TeamId>>(
  results: readonly Result[],
  match: MatchIdentity<TeamId>
): Result | undefined {
  return results.find((result) => isSameMatch(result, match));
}

/** True once every fixture of `matchday` has a result. A matchday with no
 * fixtures counts as fully played, since nothing is left to play.
 *
 * @deprecated MVP1 triple lookup. Use `isPhaseMatchdayPlayed` in new code.
 * Task 109 removes it.
 */
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
 * when every fixture has a result, or when there are no fixtures.
 *
 * @deprecated MVP1 triple lookup. Use `findPhaseCurrentMatchday` in new code.
 * Task 109 removes it.
 */
export function findCurrentMatchday<TeamId>(
  fixtures: readonly Fixture<TeamId>[],
  results: readonly MatchIdentity<TeamId>[]
): number | undefined {
  const unplayed = fixtures
    .filter((fixture) => findResult(results, fixture) === undefined)
    .map((fixture) => fixture.matchday);
  return unplayed.length === 0 ? undefined : Math.min(...unplayed);
}

/** The result of one fixture, found by its id (Task 77). `undefined` when
 * the fixture has no result. */
export function findPhaseResult<Result extends { fixtureId: string }>(
  results: readonly Result[],
  fixture: Pick<PhaseFixture<unknown>, 'id'>
): Result | undefined {
  return results.find((result) => result.fixtureId === fixture.id);
}

/** True once every fixture of `matchday` has a result, found by id. A
 * matchday with no fixtures counts as fully played, since nothing is left to
 * play. */
export function isPhaseMatchdayPlayed<TeamId>(
  fixtures: readonly PhaseFixture<TeamId>[],
  results: readonly { fixtureId: string }[],
  matchday: number
): boolean {
  const played = new Set(results.map((result) => result.fixtureId));
  return fixtures
    .filter((fixture) => fixture.matchday === matchday)
    .every((fixture) => played.has(fixture.id));
}

/** The lowest matchday with a fixture that has no result, found by id: the
 * next one to play. A matchday skipped earlier is still the current one.
 * `undefined` when every fixture has a result, or when there are no
 * fixtures. */
export function findPhaseCurrentMatchday<TeamId>(
  fixtures: readonly PhaseFixture<TeamId>[],
  results: readonly { fixtureId: string }[]
): number | undefined {
  const played = new Set(results.map((result) => result.fixtureId));
  const unplayed = fixtures
    .filter((fixture) => !played.has(fixture.id))
    .map((fixture) => fixture.matchday);
  return unplayed.length === 0 ? undefined : Math.min(...unplayed);
}
