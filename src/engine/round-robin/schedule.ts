import type { PhaseFixture } from './types';

/**
 * Lookups over the fixtures and results of one phase. A result finds its
 * fixture by `fixtureId` (Task 77, Task 105): matchdays start again in each
 * phase and groups share them, so the matchday and the two teams do not
 * name one match. Task 162 removed the MVP1 lookups by that triple.
 *
 * Each function takes plain arrays, not a league record, so the engine does
 * not depend on how the app stores a league. Pass the fixtures and results
 * of one phase only.
 */

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
