import type { Fixture, FixturePosition, PhaseFixture } from './types';

/**
 * Builds the id of a round-robin fixture from its place in the league
 * (Task 77): `p{phase}.g{group}.md{matchday}.m{match}`, for example
 * `p1.g2.md3.m4`. The id is unique in its league, and needs no random
 * source.
 *
 * This is the only function that builds an id. No code parses one: compare
 * ids as opaque strings, so the format can change with no other edit.
 *
 * Throws a `RangeError` if a number is not a whole number of 1 or more.
 */
export function fixtureId(position: FixturePosition): string {
  for (const field of ['phase', 'group', 'matchday', 'match'] as const) {
    const value = position[field];
    if (!Number.isInteger(value) || value < 1) {
      throw new RangeError(
        `A fixture id needs a whole number of 1 or more for "${field}". It got ${value}.`
      );
    }
  }
  const { phase, group, matchday, match } = position;
  return `p${phase}.g${group}.md${matchday}.m${match}`;
}

/**
 * Gives each fixture of one schedule its id, when its phase starts. The
 * order stays the same. `match` is the place of a fixture inside its
 * matchday, in list order, so the ids follow the match order that
 * `generateRoundRobin` gives, shuffled or not (Task 30).
 *
 * The input does not change. Throws the `fixtureId` `RangeError` for a bad
 * phase or group.
 */
export function assignFixtureIds<TeamId>(
  fixtures: readonly Fixture<TeamId>[],
  { phase, group }: Pick<FixturePosition, 'phase' | 'group'>
): PhaseFixture<TeamId>[] {
  const matchesSoFar = new Map<number, number>();
  return fixtures.map((fixture) => {
    const match = (matchesSoFar.get(fixture.matchday) ?? 0) + 1;
    matchesSoFar.set(fixture.matchday, match);
    return {
      id: fixtureId({ phase, group, matchday: fixture.matchday, match }),
      ...fixture,
    };
  });
}
