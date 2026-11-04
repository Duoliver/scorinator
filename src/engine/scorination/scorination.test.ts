import { describe, expect, it } from 'vitest';
import { createSeededRng } from '@/engine/rng';
import * as scorinationModule from './index';
import {
  ABS_WEIGHT,
  BASE_GOALS_PER_TEAM,
  DIFF_WEIGHT,
  ELASTICITY_MAX,
  ELASTICITY_MIN,
  HOME_ADVANTAGE_FLAT,
  HOME_ADVANTAGE_PERCENT,
  AET_TIME_SHARE,
  REFERENCE_OVR,
  applyHomeAdvantage,
  computeExpectedGoals,
  playMatch,
  rollElasticity,
  scorinateExtraTime,
  scorinateMatch,
  scorinatePeriod,
} from './index';

const TRIALS = 3000;

function average(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

describe('computeExpectedGoals', () => {
  it('returns the league baseline for an even matchup at the reference OVR, elasticity 1', () => {
    expect(computeExpectedGoals(REFERENCE_OVR, REFERENCE_OVR, 1)).toBeCloseTo(
      BASE_GOALS_PER_TEAM,
      10
    );
  });

  it('scales linearly with elasticity, holding OVR fixed', () => {
    const base = computeExpectedGoals(REFERENCE_OVR, REFERENCE_OVR, 1);
    expect(computeExpectedGoals(REFERENCE_OVR, REFERENCE_OVR, 2)).toBeCloseTo(
      base * 2,
      10
    );
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
    expect(rollElasticity(createSeededRng(11))).toBe(
      rollElasticity(createSeededRng(11))
    );
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

  it("keeps the average close to the spec's ~1.3 goals/team baseline, for an even mid-tier matchup", () => {
    const goals: number[] = [];
    for (let seed = 0; seed < TRIALS; seed++) {
      const { homeGoals, awayGoals } = scorinateMatch(
        REFERENCE_OVR,
        REFERENCE_OVR,
        createSeededRng(seed)
      );
      goals.push(homeGoals, awayGoals);
    }
    expect(average(goals)).toBeGreaterThan(1.0);
    expect(average(goals)).toBeLessThan(1.6);
  });

  it('trends two evenly matched teams toward similar scorelines regardless of tier, per spec §1', () => {
    const averageCombinedGoals = (ovr: number): number => {
      let total = 0;
      for (let seed = 0; seed < TRIALS; seed++) {
        const { homeGoals, awayGoals } = scorinateMatch(
          ovr,
          ovr,
          createSeededRng(seed)
        );
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

  it('gives the same scores as before Task 134, for fixed seeds (stored seeded runs stay the same)', () => {
    // Recorded from the code before scorinatePeriod existed. A change in
    // the order of the RNG draws makes this test fail.
    const pinned: [number, number, number, [number, number][]][] = [
      [
        1,
        65,
        65,
        [
          [0, 3],
          [3, 1],
          [0, 0],
          [0, 2],
          [0, 0],
        ],
      ],
      [
        42,
        80,
        65,
        [
          [3, 1],
          [2, 2],
          [1, 1],
          [1, 1],
          [0, 0],
        ],
      ],
      [
        7,
        35,
        95,
        [
          [0, 3],
          [0, 3],
          [0, 2],
          [0, 3],
          [0, 1],
        ],
      ],
      [
        2026,
        99,
        30,
        [
          [3, 0],
          [2, 0],
          [2, 0],
          [2, 0],
          [5, 0],
        ],
      ],
    ];
    for (const [seed, homeOvr, awayOvr, scores] of pinned) {
      const rng = createSeededRng(seed);
      const actual = scores.map(() => {
        const { homeGoals, awayGoals } = scorinateMatch(homeOvr, awayOvr, rng);
        return [homeGoals, awayGoals];
      });
      expect(actual).toEqual(scores);
    }
  });
});

describe('scorinatePeriod', () => {
  it('gives the same score as scorinateMatch for a time share of 1 and the same elasticity roll', () => {
    for (let seed = 0; seed < 200; seed++) {
      const rng = createSeededRng(seed);
      const elasticity = rollElasticity(rng);
      expect(scorinatePeriod(75, 60, elasticity, 1, rng)).toEqual(
        scorinateMatch(75, 60, createSeededRng(seed))
      );
    }
  });

  it('scales the mean goals with the time share', () => {
    const meanGoals = (timeShare: number): number => {
      const rng = createSeededRng(5);
      let total = 0;
      for (let trial = 0; trial < 20000; trial++) {
        const { homeGoals, awayGoals } = scorinatePeriod(65, 65, 1, timeShare, rng);
        total += homeGoals + awayGoals;
      }
      return total / 20000;
    };
    // Expected: 2 × 1.3 × share, so 2.6 for the full match, 0.87 for 1/3.
    expect(meanGoals(1)).toBeCloseTo(2.6, 1);
    expect(meanGoals(1 / 3)).toBeCloseTo(0.87, 1);
  });
});

describe('scorinateExtraTime', () => {
  it('plays one third of a match (Task 80)', () => {
    expect(AET_TIME_SHARE).toBe(1 / 3);
  });

  it('is deterministic: the same seed gives the same AET score', () => {
    expect(scorinateExtraTime(70, 70, 1.1, createSeededRng(42))).toEqual(
      scorinateExtraTime(70, 70, 1.1, createSeededRng(42))
    );
  });

  it('equals scorinatePeriod with the AET time share', () => {
    for (let seed = 0; seed < 200; seed++) {
      expect(scorinateExtraTime(80, 65, 0.9, createSeededRng(seed))).toEqual(
        scorinatePeriod(80, 65, 0.9, AET_TIME_SHARE, createSeededRng(seed))
      );
    }
  });

  it('never returns a negative goal count', () => {
    for (let seed = 0; seed < 500; seed++) {
      const score = scorinateExtraTime(90, 40, 1.6, createSeededRng(seed));
      expect(score.homeGoals).toBeGreaterThanOrEqual(0);
      expect(score.awayGoals).toBeGreaterThanOrEqual(0);
    }
  });
});

describe('AET statistics (Task 80 bands, US-03.1)', () => {
  const AET_SAMPLE = 10000;

  interface AetSample {
    drawnShare: number;
    meanGoals: number;
    homeWinShareOfDecided: number;
  }

  // Plays full matches as the bracket does: one elasticity roll for the
  // match, and the AET only after a draw, with the same elasticity. A drawn
  // match has a lower elasticity on average, so a new roll for the AET
  // measures something else than the Task 80 bands.
  function sampleAets(homeOvr: number, awayOvr: number, seed: number): AetSample {
    const rng = createSeededRng(seed);
    let aets = 0;
    let drawn = 0;
    let goals = 0;
    let homeWins = 0;
    while (aets < AET_SAMPLE) {
      const elasticity = rollElasticity(rng);
      const match = scorinatePeriod(homeOvr, awayOvr, elasticity, 1, rng);
      if (match.homeGoals !== match.awayGoals) continue;
      const aet = scorinateExtraTime(homeOvr, awayOvr, elasticity, rng);
      aets++;
      goals += aet.homeGoals + aet.awayGoals;
      if (aet.homeGoals === aet.awayGoals) drawn++;
      if (aet.homeGoals > aet.awayGoals) homeWins++;
    }
    return {
      drawnShare: drawn / aets,
      meanGoals: goals / aets,
      homeWinShareOfDecided: homeWins / (aets - drawn),
    };
  }

  it.each([35, 65, 95])(
    'equal teams at OVR %i: 48 to 60 percent of AETs stay drawn',
    (ovr) => {
      const { drawnShare } = sampleAets(ovr, ovr, 134);
      expect(drawnShare).toBeGreaterThanOrEqual(0.48);
      expect(drawnShare).toBeLessThanOrEqual(0.6);
    }
  );

  it.each([35, 65, 95])(
    'equal teams at OVR %i: the mean AET goals are 0.65 to 0.95',
    (ovr) => {
      const { meanGoals } = sampleAets(ovr, ovr, 134);
      expect(meanGoals).toBeGreaterThanOrEqual(0.65);
      expect(meanGoals).toBeLessThanOrEqual(0.95);
    }
  );

  it('OVR 80 v 65: the stronger team wins 60 to 70 percent of decided AETs', () => {
    const { homeWinShareOfDecided } = sampleAets(80, 65, 134);
    expect(homeWinShareOfDecided).toBeGreaterThanOrEqual(0.6);
    expect(homeWinShareOfDecided).toBeLessThanOrEqual(0.7);
  });
});

describe('applyHomeAdvantage', () => {
  it('adds the percentage part first, rounds, then adds the flat part (MVP1 spec §1)', () => {
    for (const ovr of [30, 35, 65, 80, 95, 99]) {
      expect(applyHomeAdvantage(ovr)).toBe(
        Math.round(ovr * (1 + HOME_ADVANTAGE_PERCENT)) + HOME_ADVANTAGE_FLAT
      );
    }
  });

  it('gives +5 flat and +5%: 35 -> 42, 65 -> 73, 80 -> 89, 99 -> 109', () => {
    expect(applyHomeAdvantage(35)).toBe(42);
    expect(applyHomeAdvantage(65)).toBe(73);
    expect(applyHomeAdvantage(80)).toBe(89);
    expect(applyHomeAdvantage(99)).toBe(109);
  });

  it('never lowers an OVR value', () => {
    for (const ovr of [0, 1, 30, 65, 99]) {
      expect(applyHomeAdvantage(ovr)).toBeGreaterThanOrEqual(ovr);
    }
  });
});

describe('home advantage effect on scorinateMatch', () => {
  const WIN_GAP_TRIALS = 20000;

  /** Home win rate minus away win rate, in percentage points, for two teams
   * of equal OVR with the home boost on. Seeded, so the result is fixed. */
  const winGap = (ovr: number): number => {
    let homeWins = 0;
    let awayWins = 0;
    for (let seed = 0; seed < WIN_GAP_TRIALS; seed++) {
      const { homeGoals, awayGoals } = scorinateMatch(
        applyHomeAdvantage(ovr),
        ovr,
        createSeededRng(seed)
      );
      if (homeGoals > awayGoals) homeWins++;
      else if (awayGoals > homeGoals) awayWins++;
    }
    return ((homeWins - awayWins) / WIN_GAP_TRIALS) * 100;
  };

  // Targets from the Task 32 measurement (200,000 matches each): +13.2,
  // +15.9, and +20.7 points. Real football is about +16 (MVP1 spec §1).
  // Each band is the target +/- 2.5 points.
  it.each([
    [35, 13.2],
    [65, 15.9],
    [95, 20.7],
  ])('gives equal teams at OVR %i a home win gap near %f points', (ovr, target) => {
    const gap = winGap(ovr);
    expect(gap).toBeGreaterThan(target - 2.5);
    expect(gap).toBeLessThan(target + 2.5);
  });
});

describe('playMatch', () => {
  // Same seed, same draws: `playMatch` must give exactly the score that
  // `scorinateMatch` gives for the OVRs it is meant to pass on.
  it('scorinates the OVRs unchanged when the league has no home advantage', () => {
    for (let seed = 1; seed <= 50; seed++) {
      expect(playMatch(72, 64, false, createSeededRng(seed))).toEqual(
        scorinateMatch(72, 64, createSeededRng(seed))
      );
    }
  });

  it('boosts only the home OVR when the league has home advantage', () => {
    for (let seed = 1; seed <= 50; seed++) {
      expect(playMatch(72, 64, true, createSeededRng(seed))).toEqual(
        scorinateMatch(applyHomeAdvantage(72), 64, createSeededRng(seed))
      );
    }
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
        'HOME_ADVANTAGE_FLAT',
        'HOME_ADVANTAGE_PERCENT',
        'AET_TIME_SHARE',
        'rollElasticity',
        'computeExpectedGoals',
        'applyHomeAdvantage',
        'scorinateMatch',
        'scorinatePeriod',
        'scorinateExtraTime',
        'playMatch',
      ].sort()
    );
  });
});
