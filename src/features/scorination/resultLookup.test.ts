import { describe, expect, it } from 'vitest';
import { findResult, isMatchdayFullyPlayed } from './resultLookup';
import type { LeagueRecord, LeagueResult } from '@/features/leagues/types';

const league = (overrides: Partial<LeagueRecord> = {}): LeagueRecord => ({
  slug: 'coastal-premier',
  name: 'Coastal Premier',
  homeAdvantage: false,
  points: { win: 3, draw: 1, loss: 0 },
  teams: [],
  fixtures: [
    { matchday: 1, home: 'fc-united', away: 'fc-rivals' },
    { matchday: 1, home: 'fc-town', away: 'fc-rangers' },
    { matchday: 2, home: 'fc-rivals', away: 'fc-town' },
  ],
  byes: [],
  results: [],
  ...overrides,
});

const result = (overrides: Partial<LeagueResult> = {}): LeagueResult => ({
  matchday: 1,
  home: 'fc-united',
  away: 'fc-rivals',
  homeGoals: 2,
  awayGoals: 1,
  ...overrides,
});

describe('findResult', () => {
  it('returns the result matching the exact matchday/home/away triple', () => {
    const played = result();
    const found = findResult(
      league({ results: [played] }),
      { matchday: 1, home: 'fc-united', away: 'fc-rivals' }
    );
    expect(found).toEqual(played);
  });

  it('returns undefined for a fixture with no recorded result', () => {
    const found = findResult(league(), { matchday: 1, home: 'fc-united', away: 'fc-rivals' });
    expect(found).toBeUndefined();
  });

  it('does not match a result from a different matchday, even with the same teams', () => {
    const wrongMatchday = result({ matchday: 2 });
    const found = findResult(
      league({ results: [wrongMatchday] }),
      { matchday: 1, home: 'fc-united', away: 'fc-rivals' }
    );
    expect(found).toBeUndefined();
  });
});

describe('isMatchdayFullyPlayed', () => {
  it('is false when at least one fixture on the matchday has no result', () => {
    expect(isMatchdayFullyPlayed(league({ results: [result()] }), 1)).toBe(false);
  });

  it('is true once every fixture on the matchday has a result', () => {
    const both = [
      result(),
      result({ home: 'fc-town', away: 'fc-rangers', homeGoals: 0, awayGoals: 0 }),
    ];
    expect(isMatchdayFullyPlayed(league({ results: both }), 1)).toBe(true);
  });

  it('is true for a matchday with no fixtures at all', () => {
    expect(isMatchdayFullyPlayed(league({ fixtures: [] }), 5)).toBe(true);
  });
});
