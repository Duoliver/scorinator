import { describe, expect, it } from 'vitest';
import { describeLeague } from './leagueSummary';
import type { LeagueRecord } from './types';

const league = (overrides: Partial<LeagueRecord> = {}): LeagueRecord => ({
  slug: 'coastal-premier',
  name: 'Coastal Premier',
  homeAdvantage: true,
  points: { win: 3, draw: 1, loss: 0 },
  teams: [{ slug: 'fc-united', ovr: 70 }],
  fixtures: [],
  byes: [],
  results: [],
  ...overrides,
});

describe('describeLeague', () => {
  it('uses the singular "team" for exactly one team', () => {
    expect(describeLeague(league({ teams: [{ slug: 'fc-united', ovr: 70 }] }))).toBe(
      'Round robin (two-way) · 1 team · Home adv. on'
    );
  });

  it('uses the plural "teams" for any other count', () => {
    expect(describeLeague(league({ teams: [] }))).toBe(
      'Round robin (two-way) · 0 teams · Home adv. on'
    );
  });

  it('reflects home advantage being on', () => {
    expect(describeLeague(league({ homeAdvantage: true }))).toContain('Home adv. on');
  });

  it('reflects home advantage being off', () => {
    expect(describeLeague(league({ homeAdvantage: false }))).toContain('Home adv. off');
  });
});
