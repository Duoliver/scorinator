import { describe, expect, it } from 'vitest';
import { createSeededRng, type Rng } from '@/engine/rng';
import {
  PENALTY_KICK_BASE,
  PENALTY_KICK_MAX,
  PENALTY_KICK_MIN,
  PENALTY_KICK_WEIGHT,
  PENALTY_ROUNDS,
  computeKickChance,
  scorinatePenalties,
  tossCoin,
} from './index';

const SAMPLE = 20000;

// Gives the values in order. A kick scores when the value is below its
// chance, so 0 always scores and 0.99 always misses.
function scriptRng(values: number[]): Rng {
  let next = 0;
  return () => {
    if (next >= values.length) throw new Error('The scripted Rng has no more values.');
    return values[next++];
  };
}

const SCORE = 0;
const MISS = 0.99;
const HOME_FIRST = 0.1;
const AWAY_FIRST = 0.9;

describe('computeKickChance', () => {
  it('gives 0.75 to equal teams (Task 80)', () => {
    expect(computeKickChance(70, 70)).toBe(0.75);
  });

  it('adds 0.10 × the OVR gap / 100', () => {
    expect(computeKickChance(95, 65)).toBeCloseTo(0.78, 10);
    expect(computeKickChance(65, 95)).toBeCloseTo(0.72, 10);
  });

  it('stays inside 0.6 to 0.9', () => {
    expect(computeKickChance(400, 0)).toBe(0.9);
    expect(computeKickChance(0, 400)).toBe(0.6);
  });

  it('uses the Task 80 constants', () => {
    expect([
      PENALTY_KICK_BASE,
      PENALTY_KICK_WEIGHT,
      PENALTY_KICK_MIN,
      PENALTY_KICK_MAX,
      PENALTY_ROUNDS,
    ]).toEqual([0.75, 0.1, 0.6, 0.9, 5]);
  });
});

describe('scorinatePenalties', () => {
  it('stops when one team cannot catch up: 3–0 after three kicks each', () => {
    const rng = scriptRng([HOME_FIRST, SCORE, MISS, SCORE, MISS, SCORE, MISS]);
    expect(scorinatePenalties(65, 65, rng)).toEqual({ homeGoals: 3, awayGoals: 0 });
  });

  it('stops in the middle of a round, after the first kicker of the round', () => {
    // Home first. After three rounds it is 1–3. The fourth home kick misses,
    // so home can reach 2 at most, and the away team does not kick.
    const rng = scriptRng([HOME_FIRST, SCORE, SCORE, MISS, SCORE, MISS, SCORE, MISS]);
    expect(scorinatePenalties(65, 65, rng)).toEqual({ homeGoals: 1, awayGoals: 3 });
  });

  it('lets the away team kick first when the Rng picks it', () => {
    // Away first: the away team scores three, the home team misses three.
    const rng = scriptRng([AWAY_FIRST, SCORE, MISS, SCORE, MISS, SCORE, MISS]);
    expect(scorinatePenalties(65, 65, rng)).toEqual({ homeGoals: 0, awayGoals: 3 });
  });

  it('goes to sudden death in pairs after five kicks each', () => {
    const level = Array.from({ length: 10 }, () => SCORE);
    const rng = scriptRng([
      HOME_FIRST,
      ...level,
      MISS,
      MISS,
      SCORE,
      SCORE,
      SCORE,
      MISS,
    ]);
    expect(scorinatePenalties(65, 65, rng)).toEqual({ homeGoals: 7, awayGoals: 6 });
  });

  it('is deterministic: the same seed gives the same shootout', () => {
    expect(scorinatePenalties(80, 60, createSeededRng(9))).toEqual(
      scorinatePenalties(80, 60, createSeededRng(9))
    );
  });

  it('never ends level', () => {
    for (let seed = 0; seed < 2000; seed++) {
      const { homeGoals, awayGoals } = scorinatePenalties(
        70,
        70,
        createSeededRng(seed)
      );
      expect(homeGoals).not.toBe(awayGoals);
    }
  });
});

describe('penalty statistics (Task 80 bands, US-03.3)', () => {
  function strongerWinShare(gap: number): number {
    const rng = createSeededRng(135);
    let wins = 0;
    for (let trial = 0; trial < SAMPLE; trial++) {
      const { homeGoals, awayGoals } = scorinatePenalties(65 + gap, 65, rng);
      if (homeGoals > awayGoals) wins++;
    }
    return wins / SAMPLE;
  }

  it.each([
    [0, 0.47, 0.53],
    [15, 0.52, 0.59],
    [30, 0.57, 0.64],
    [60, 0.66, 0.75],
  ])('gap %i: the stronger team wins %f to %f of shootouts', (gap, min, max) => {
    const share = strongerWinShare(gap);
    expect(share).toBeGreaterThanOrEqual(min);
    expect(share).toBeLessThanOrEqual(max);
  });

  it('equal teams: 72 to 78 percent of kicks score', () => {
    // Each Rng call after the first-kicker pick is one kick.
    let calls = 0;
    const seeded = createSeededRng(135);
    const rng: Rng = () => {
      calls++;
      return seeded();
    };
    let goals = 0;
    for (let trial = 0; trial < SAMPLE; trial++) {
      const { homeGoals, awayGoals } = scorinatePenalties(65, 65, rng);
      goals += homeGoals + awayGoals;
    }
    const kicks = calls - SAMPLE;
    expect(goals / kicks).toBeGreaterThanOrEqual(0.72);
    expect(goals / kicks).toBeLessThanOrEqual(0.78);
  });
});

describe('tossCoin', () => {
  it('gives home below 0.5 and away from 0.5', () => {
    expect(tossCoin(() => 0.3)).toBe('home');
    expect(tossCoin(() => 0.5)).toBe('away');
  });

  it('is a pure 50/50: the home side wins 47 to 53 percent of tosses', () => {
    const rng = createSeededRng(135);
    let home = 0;
    for (let trial = 0; trial < SAMPLE; trial++) {
      if (tossCoin(rng) === 'home') home++;
    }
    expect(home / SAMPLE).toBeGreaterThanOrEqual(0.47);
    expect(home / SAMPLE).toBeLessThanOrEqual(0.53);
  });
});
