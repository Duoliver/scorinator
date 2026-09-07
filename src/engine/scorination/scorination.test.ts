import { describe, expect, it } from 'vitest';
import { createSeededRng } from '../rng';
import * as scorinationModule from './index';
import {
  ABS_WEIGHT,
  BASE_GOALS_PER_TEAM,
  DIFF_WEIGHT,
  ELASTICITY_MAX,
  ELASTICITY_MIN,
  HOME_ADVANTAGE_BOOST,
  REFERENCE_OVR,
  applyHomeAdvantage,
  computeExpectedGoals,
  rollElasticity,
  scorinateMatch,
} from './index';

const TRIALS = 3000;

function average(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

describe('computeExpectedGoals', () => {
  it('returns the league baseline for an even matchup at the reference OVR, elasticity 1', () => {
    expect(computeExpectedGoals(REFERENCE_OVR, REFERENCE_OVR, 1)).toBeCloseTo(BASE_GOALS_PER_TEAM, 10);
  });

  it('scales linearly with elasticity, holding OVR fixed', () => {
    const base = computeExpectedGoals(REFERENCE_OVR, REFERENCE_OVR, 1);
    expect(computeExpectedGoals(REFERENCE_OVR, REFERENCE_OVR, 2)).toBeCloseTo(base * 2, 10);
  });

  it('rewards a higher OVR than the opponent, and punishes a lower one', () => {
    const favoured = computeExpectedGoals(80, 60, 1);
    const even = computeExpectedGoals(70, 70, 1);
    const underdog = computeExpectedGoals(60, 80, 1);
    expect(favoured).toBeGreaterThan(even);
    expect(underdog).toBeLessThan(even);
  });

  it('gives absolute OVR a smaller pull than OVR difference, at the confirmed 5:1 ratio', () => {
    expect(DIFF_WEIGHT / ABS_WEIGHT).toBeCloseTo(5, 5);
    // Two evenly matched teams (no OVR difference) still get a mild
    // absolute-OVR nudge: a high-tier pairing scores a bit more than a
    // low-tier one, but nowhere near as much as an OVR-difference gap of
    // the same size would.
    const highTierEven = computeExpectedGoals(95, 95, 1);
    const lowTierEven = computeExpectedGoals(35, 35, 1);
    expect(highTierEven).toBeGreaterThan(lowTierEven);
    expect(highTierEven - lowTierEven).toBeLessThan(0.5);
  });

  it('never drops to zero or below, even for an extreme mismatch', () => {
    expect(computeExpectedGoals(1, 1000, 1)).toBeGreaterThan(0);
  });

  it('clamps the OVR-difference and absolute-OVR factors instead of scaling without bound', () => {
    const extreme = computeExpectedGoals(10_000, 0, 1);
    const lessExtreme = computeExpectedGoals(1_000, 0, 1);
    // Both inputs sit past the clamp ceiling, so pushing the OVR gap
    // further does not push expected goals any further.
    expect(extreme).toBeCloseTo(lessExtreme, 10);
  });
});

describe('rollElasticity', () => {
  it('always lands inside [ELASTICITY_MIN, ELASTICITY_MAX], across many seeds', () => {
    for (let seed = 0; seed < 500; seed++) {
      const value = rollElasticity(createSeededRng(seed));
      expect(value).toBeGreaterThanOrEqual(ELASTICITY_MIN);
      expect(value).toBeLessThanOrEqual(ELASTICITY_MAX);
    }
  });

  it('is deterministic: the same seed gives the same roll', () => {
    expect(rollElasticity(createSeededRng(11))).toBe(rollElasticity(createSeededRng(11)));
  });
});

describe('scorinateMatch', () => {
  it('is deterministic: the same seed gives the same score', () => {
    const scoreA = scorinateMatch(70, 70, createSeededRng(42));
    const scoreB = scorinateMatch(70, 70, createSeededRng(42));
    expect(scoreA).toEqual(scoreB);
  });

  it('never returns a negative goal count', () => {
    for (let seed = 0; seed < 500; seed++) {
      const score = scorinateMatch(90, 40, createSeededRng(seed));
      expect(score.homeGoals).toBeGreaterThanOrEqual(0);
      expect(score.awayGoals).toBeGreaterThanOrEqual(0);
    }
  });

  it('favors a high-OVR team over a low-OVR one, but leaves upsets possible', () => {
    let homeWins = 0;
    let awayWins = 0;
    for (let seed = 0; seed < TRIALS; seed++) {
      const { homeGoals, awayGoals } = scorinateMatch(95, 32, createSeededRng(seed));
      if (homeGoals > awayGoals) homeWins++;
      if (awayGoals > homeGoals) awayWins++;
    }
    expect(homeWins / TRIALS).toBeGreaterThan(0.85);
    // The underdog still wins sometimes — a weighted-probability outcome,
    // not a guaranteed one (spec §2, Scorination epic).
    expect(awayWins).toBeGreaterThan(0);
  });

  it('keeps the average close to the spec\'s ~1.3 goals/team baseline, for an even mid-tier matchup', () => {
    const goals: number[] = [];
    for (let seed = 0; seed < TRIALS; seed++) {
      const { homeGoals, awayGoals } = scorinateMatch(REFERENCE_OVR, REFERENCE_OVR, createSeededRng(seed));
      goals.push(homeGoals, awayGoals);
    }
    expect(average(goals)).toBeGreaterThan(1.0);
    expect(average(goals)).toBeLessThan(1.6);
  });

  it('trends two evenly matched teams toward similar scorelines regardless of tier, per spec §1', () => {
    const averageCombinedGoals = (ovr: number): number => {
      let total = 0;
      for (let seed = 0; seed < TRIALS; seed++) {
        const { homeGoals, awayGoals } = scorinateMatch(ovr, ovr, createSeededRng(seed));
        total += homeGoals + awayGoals;
      }
      return total / TRIALS;
    };
    const highTier = averageCombinedGoals(95);
    const lowTier = averageCombinedGoals(35);
    // Elasticity, not tier level, is what should swing a match open or
    // shut, so the two averages stay close — even though absolute OVR
    // gives the high tier a small edge (see computeExpectedGoals above).
    expect(Math.abs(highTier - lowTier)).toBeLessThan(1.0);
  });

  it('varies the scoreline from match to match between the same two teams, via elasticity', () => {
    const combinedGoals = new Set<number>();
    for (let seed = 0; seed < 100; seed++) {
      const { homeGoals, awayGoals } = scorinateMatch(70, 70, createSeededRng(seed));
      combinedGoals.add(homeGoals + awayGoals);
    }
    // Not every seed should produce the same combined score — elasticity
    // is match-to-match randomness, not a fixed per-team trait (spec §1).
    expect(combinedGoals.size).toBeGreaterThan(1);
  });
});

describe('applyHomeAdvantage', () => {
  it('boosts OVR by the configured percentage, rounded to a whole number', () => {
    expect(applyHomeAdvantage(80)).toBe(Math.round(80 * (1 + HOME_ADVANTAGE_BOOST)));
    expect(applyHomeAdvantage(80)).toBe(84);
  });

  it('never lowers an OVR value', () => {
    for (const ovr of [0, 1, 30, 65, 99]) {
      expect(applyHomeAdvantage(ovr)).toBeGreaterThanOrEqual(ovr);
    }
  });
});

describe('home advantage effect on scorinateMatch', () => {
  it('raises the home team\'s win rate against an otherwise evenly matched away team', () => {
    const homeWinRate = (homeOvr: number, awayOvr: number): number => {
      let homeWins = 0;
      for (let seed = 0; seed < TRIALS; seed++) {
        const { homeGoals, awayGoals } = scorinateMatch(homeOvr, awayOvr, createSeededRng(seed));
        if (homeGoals > awayGoals) homeWins++;
      }
      return homeWins / TRIALS;
    };
    const withoutBoost = homeWinRate(70, 70);
    const withBoost = homeWinRate(applyHomeAdvantage(70), 70);
    expect(withBoost).toBeGreaterThan(withoutBoost);
  });
});

describe('module surface', () => {
  it('exports exactly the constants and functions this module intends to expose', () => {
    expect(Object.keys(scorinationModule).sort()).toEqual(
      [
        'BASE_GOALS_PER_TEAM',
        'REFERENCE_OVR',
        'DIFF_WEIGHT',
        'ABS_WEIGHT',
        'ELASTICITY_MIN',
        'ELASTICITY_MAX',
        'HOME_ADVANTAGE_BOOST',
        'rollElasticity',
        'computeExpectedGoals',
        'applyHomeAdvantage',
        'scorinateMatch',
      ].sort()
    );
  });
});
