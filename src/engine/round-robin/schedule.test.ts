import { describe, expect, it } from 'vitest';
import {
  findCurrentMatchday,
  findResult,
  isMatchdayFullyPlayed,
  isSameMatch,
  matchKey,
} from './schedule';
import type { Fixture } from './types';

interface Result extends Fixture<string> {
  homeGoals: number;
  awayGoals: number;
}

const fixtures: Fixture<string>[] = [
  { matchday: 1, home: 'fc-united', away: 'fc-rivals' },
  { matchday: 1, home: 'fc-town', away: 'fc-rangers' },
  { matchday: 2, home: 'fc-rivals', away: 'fc-town' },
];

const result = (overrides: Partial<Result> = {}): Result => ({
  matchday: 1,
  home: 'fc-united',
  away: 'fc-rivals',
  homeGoals: 2,
  awayGoals: 1,
  ...overrides,
});

describe('isSameMatch', () => {
  it('is true for the same matchday, home, and away', () => {
    expect(isSameMatch(result(), fixtures[0])).toBe(true);
  });

  it('is false when only the matchday differs', () => {
    expect(isSameMatch(result({ matchday: 2 }), fixtures[0])).toBe(false);
  });

  it('is false for the reverse fixture, with home and away swapped', () => {
    expect(
      isSameMatch(result({ home: 'fc-rivals', away: 'fc-united' }), fixtures[0])
    ).toBe(false);
  });
});

describe('matchKey', () => {
  it('gives the same key for a fixture and its result', () => {
    expect(matchKey(result())).toBe(matchKey(fixtures[0]));
  });

  it('gives two keys for two team pairs that join to the same text', () => {
    const a = { matchday: 1, home: 'fc', away: 'a-b' };
    const b = { matchday: 1, home: 'fc-a', away: 'b' };
    expect(matchKey(a)).not.toBe(matchKey(b));
  });
});

describe('findResult', () => {
  it('returns the result of the fixture', () => {
    const played = result();
    expect(findResult([played], fixtures[0])).toBe(played);
  });

  it('returns undefined for a fixture with no result', () => {
    expect(findResult([], fixtures[0])).toBeUndefined();
  });

  it('does not match a result from another matchday, even with the same teams', () => {
    expect(findResult([result({ matchday: 2 })], fixtures[0])).toBeUndefined();
  });
});

describe('isMatchdayFullyPlayed', () => {
  it('is false when at least one fixture on the matchday has no result', () => {
    expect(isMatchdayFullyPlayed(fixtures, [result()], 1)).toBe(false);
  });

  it('is true once every fixture on the matchday has a result', () => {
    const both = [
      result(),
      result({ home: 'fc-town', away: 'fc-rangers', homeGoals: 0, awayGoals: 0 }),
    ];
    expect(isMatchdayFullyPlayed(fixtures, both, 1)).toBe(true);
  });

  it('is true for a matchday with no fixtures at all', () => {
    expect(isMatchdayFullyPlayed([], [], 5)).toBe(true);
  });
});

describe('findCurrentMatchday', () => {
  const matchdayOne = [
    result(),
    result({ home: 'fc-town', away: 'fc-rangers', homeGoals: 0, awayGoals: 0 }),
  ];
  const matchdayTwo = result({ matchday: 2, home: 'fc-rivals', away: 'fc-town' });

  it('is the first matchday when nothing is played', () => {
    expect(findCurrentMatchday(fixtures, [])).toBe(1);
  });

  it('moves to the next matchday once the first is fully played', () => {
    expect(findCurrentMatchday(fixtures, matchdayOne)).toBe(2);
  });

  it('stays on a matchday that is only partly played', () => {
    expect(findCurrentMatchday(fixtures, [result()])).toBe(1);
  });

  it('is the earliest unplayed matchday when a later one was played first', () => {
    expect(findCurrentMatchday(fixtures, [matchdayTwo])).toBe(1);
  });

  it('is undefined once every fixture has a result', () => {
    expect(
      findCurrentMatchday(fixtures, [...matchdayOne, matchdayTwo])
    ).toBeUndefined();
  });

  it('is undefined for a schedule with no fixtures', () => {
    expect(findCurrentMatchday([], [])).toBeUndefined();
  });
});
