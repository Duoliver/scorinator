import { describe, expect, it } from 'vitest';
import type { MatchScore } from '@/engine/scorination';
import type { TieResult, TieRules } from '@/engine/tiebreak';
import { formatPlayoffRules, getPlayoffScore } from './helpers';

const ONE = 'team-1';
const TWO = 'team-2';
const score = (homeGoals: number, awayGoals: number): MatchScore => ({
  homeGoals,
  awayGoals,
});

describe('getPlayoffScore (Task 220 choice 3, the .txt export rules)', () => {
  it('gives the score of a single match, with no detail line', () => {
    const result: TieResult<string> = {
      matches: [{ part: 'leg1', homeId: ONE, awayId: TWO, score: score(2, 1) }],
      winnerId: ONE,
      loserId: TWO,
      decidedBy: 'regulation',
    };

    expect(getPlayoffScore(result, ONE, TWO)).toEqual({
      team1Goals: 2,
      team2Goals: 1,
      detail: '',
      winnerId: ONE,
    });
  });

  it('adds the legs from Team 1 first, marks the AET, and gives the penalties', () => {
    // Leg 1 at Team 1, leg 2 at Team 2 with AET, then penalties by the
    // home and away of leg 2: Team 2 scores 3, Team 1 scores 4.
    const result: TieResult<string> = {
      matches: [
        { part: 'leg1', homeId: ONE, awayId: TWO, score: score(1, 0) },
        {
          part: 'leg2',
          homeId: TWO,
          awayId: ONE,
          score: score(1, 0),
          aet: score(0, 0),
        },
      ],
      penalties: score(3, 4),
      winnerId: ONE,
      loserId: TWO,
      decidedBy: 'penalties',
    };

    expect(getPlayoffScore(result, ONE, TWO)).toEqual({
      team1Goals: 1,
      team2Goals: 1,
      detail: '1-0, 0-1* · Pens 4-3',
      winnerId: ONE,
    });
  });

  it('keeps a replay out of the total, and names the coin toss', () => {
    const result: TieResult<string> = {
      matches: [
        { part: 'leg1', homeId: ONE, awayId: TWO, score: score(1, 1) },
        { part: 'replay', homeId: ONE, awayId: TWO, score: score(0, 0) },
      ],
      winnerId: TWO,
      loserId: ONE,
      decidedBy: 'coin-toss',
    };

    expect(getPlayoffScore(result, ONE, TWO)).toEqual({
      team1Goals: 1,
      team2Goals: 1,
      detail: '1-1, 0-0 · Coin toss',
      winnerId: TWO,
    });
  });

  it('names the away goals', () => {
    const result: TieResult<string> = {
      matches: [
        { part: 'leg1', homeId: ONE, awayId: TWO, score: score(0, 1) },
        { part: 'leg2', homeId: TWO, awayId: ONE, score: score(1, 2) },
      ],
      winnerId: ONE,
      loserId: TWO,
      decidedBy: 'away-goals',
    };

    expect(getPlayoffScore(result, ONE, TWO).detail).toBe('0-1, 2-1 · Away goals');
  });
});

describe('formatPlayoffRules (Task 215 point 2)', () => {
  const rules: TieRules = {
    format: 'two-legged',
    awayGoals: true,
    playsAet: true,
    method: 'penalties',
    homeAdvantage: true,
  };

  it('lists the rules of a two-legged tie', () => {
    expect(formatPlayoffRules(rules)).toBe(
      'Two-legged · Away goals rule · Plays AET · Penalties · Home adv. on'
    );
  });

  it('lists the rules of a single match with no AET', () => {
    expect(
      formatPlayoffRules({
        ...rules,
        format: 'single-match',
        awayGoals: false,
        playsAet: false,
        method: 'replay-coin-toss',
        homeAdvantage: false,
      })
    ).toBe('Single match · Replay → Coin toss · Home adv. off');
  });
});
