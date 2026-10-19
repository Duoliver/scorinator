import { describe, expect, it } from 'vitest';
import {
  describeLeague,
  formatHomeAdvantageLabel,
  formatLeagueName,
  formatPointsLabel,
} from './leagueSummary';
import type { LeagueRecord } from '@/domain';

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

describe('formatPointsLabel', () => {
  it('lists the win, draw, and loss points', () => {
    expect(formatPointsLabel({ win: 3, draw: 1, loss: 0 })).toBe('3/1/0 pts');
  });
});

describe('formatHomeAdvantageLabel', () => {
  it('says on or off', () => {
    expect(formatHomeAdvantageLabel(true)).toBe('Home adv. on');
    expect(formatHomeAdvantageLabel(false)).toBe('Home adv. off');
  });
});

describe('formatLeagueName', () => {
  it('keeps a real name', () => {
    expect(formatLeagueName('Coastal Premier')).toBe('Coastal Premier');
  });

  it('gives a placeholder for a blank or whitespace-only name', () => {
    expect(formatLeagueName('')).toBe('Untitled league');
    expect(formatLeagueName('   ')).toBe('Untitled league');
  });
});
