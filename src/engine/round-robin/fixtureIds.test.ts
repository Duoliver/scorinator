import { describe, expect, it } from 'vitest';
import { createSeededRng } from '@/engine/rng';
import { assignFixtureIds, fixtureId, generateRoundRobin, type Fixture } from './index';

describe('fixtureId (Task 77)', () => {
  it('builds the id from the phase, group, matchday, and match', () => {
    expect(fixtureId({ phase: 1, group: 2, matchday: 3, match: 4 })).toBe(
      'p1.g2.md3.m4'
    );
  });

  it('uses group 1 for a phase with no groups', () => {
    expect(fixtureId({ phase: 2, group: 1, matchday: 10, match: 1 })).toBe(
      'p2.g1.md10.m1'
    );
  });

  it('throws a RangeError for a number below 1', () => {
    expect(() => fixtureId({ phase: 0, group: 1, matchday: 1, match: 1 })).toThrow(
      RangeError
    );
    expect(() => fixtureId({ phase: 1, group: 0, matchday: 1, match: 1 })).toThrow(
      RangeError
    );
    expect(() => fixtureId({ phase: 1, group: 1, matchday: 0, match: 1 })).toThrow(
      RangeError
    );
    expect(() => fixtureId({ phase: 1, group: 1, matchday: 1, match: -1 })).toThrow(
      RangeError
    );
  });

  it('throws a RangeError for a number that is not whole', () => {
    expect(() => fixtureId({ phase: 1.5, group: 1, matchday: 1, match: 1 })).toThrow(
      RangeError
    );
    expect(() =>
      fixtureId({ phase: 1, group: 1, matchday: Number.NaN, match: 1 })
    ).toThrow(RangeError);
  });

  it('names the bad field in the error text', () => {
    expect(() => fixtureId({ phase: 1, group: 1, matchday: 1, match: 0 })).toThrow(
      'A fixture id needs a whole number of 1 or more for "match". It got 0.'
    );
  });
});

describe('assignFixtureIds', () => {
  const fixtures: Fixture<string>[] = [
    { matchday: 1, home: 'a', away: 'd' },
    { matchday: 1, home: 'b', away: 'c' },
    { matchday: 2, home: 'd', away: 'b' },
    { matchday: 2, home: 'c', away: 'a' },
  ];

  it('gives each fixture its id, with the match number inside its matchday', () => {
    expect(assignFixtureIds(fixtures, { phase: 1, group: 1 })).toEqual([
      { id: 'p1.g1.md1.m1', matchday: 1, home: 'a', away: 'd' },
      { id: 'p1.g1.md1.m2', matchday: 1, home: 'b', away: 'c' },
      { id: 'p1.g1.md2.m1', matchday: 2, home: 'd', away: 'b' },
      { id: 'p1.g1.md2.m2', matchday: 2, home: 'c', away: 'a' },
    ]);
  });

  it('uses the phase and group it gets', () => {
    const ids = assignFixtureIds(fixtures, { phase: 3, group: 2 }).map((f) => f.id);
    expect(ids[0]).toBe('p3.g2.md1.m1');
  });

  it('keeps the list order, so the ids follow the shuffled match order (Task 30)', () => {
    const schedule = generateRoundRobin(
      ['a', 'b', 'c', 'd', 'e', 'f'],
      createSeededRng(105)
    );
    const withIds = assignFixtureIds(schedule.fixtures, { phase: 1, group: 1 });
    expect(
      withIds.map(({ matchday, home, away }) => ({ matchday, home, away }))
    ).toEqual(schedule.fixtures);
    const firstOfMatchday2 = withIds.find((f) => f.matchday === 2);
    expect(firstOfMatchday2?.id).toBe('p1.g1.md2.m1');
  });

  it('gives unique ids for an even and an odd team count', () => {
    for (const teams of [
      ['a', 'b', 'c', 'd', 'e', 'f'],
      ['a', 'b', 'c', 'd', 'e'],
    ]) {
      const { fixtures: generated } = generateRoundRobin(teams);
      const ids = assignFixtureIds(generated, { phase: 1, group: 1 }).map((f) => f.id);
      expect(new Set(ids).size).toBe(generated.length);
    }
  });

  it('does not change its input', () => {
    const input = fixtures.map((fixture) => ({ ...fixture }));
    assignFixtureIds(input, { phase: 1, group: 1 });
    expect(input).toEqual(fixtures);
  });

  it('gives an empty list for no fixtures', () => {
    expect(assignFixtureIds([], { phase: 1, group: 1 })).toEqual([]);
  });

  it('throws the fixtureId RangeError for a bad phase or group', () => {
    expect(() => assignFixtureIds(fixtures, { phase: 0, group: 1 })).toThrow(
      RangeError
    );
  });
});
