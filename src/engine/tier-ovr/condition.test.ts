import { describe, expect, it } from 'vitest';
import {
  CONDITION_LEVELS,
  TIER_OVR_RANGES,
  applyCondition,
  isConditionLevel,
  type ConditionLevel,
} from './index';

describe('CONDITION_LEVELS', () => {
  it('lists the five levels, from -2 to +2', () => {
    expect(CONDITION_LEVELS).toEqual([-2, -1, 0, 1, 2]);
  });
});

describe('isConditionLevel', () => {
  it('accepts each of the five levels', () => {
    for (const level of [-2, -1, 0, 1, 2]) expect(isConditionLevel(level)).toBe(true);
  });

  it('rejects any other value', () => {
    for (const value of [-3, 3, 0.5, -0.5, NaN, '1', '+1', null, undefined]) {
      expect(isConditionLevel(value)).toBe(false);
    }
  });
});

describe('applyCondition', () => {
  it('gives the base OVR at level 0', () => {
    expect(applyCondition(35, 0)).toBe(35);
    expect(applyCondition(99, 0)).toBe(99);
  });

  it('gives the story examples: 35 at +1 is 39, 35 at -1 is 31 (US-14.1)', () => {
    expect(applyCondition(35, 1)).toBe(39);
    expect(applyCondition(35, -1)).toBe(31);
  });

  it('rounds a positive level up and a negative level down', () => {
    // 41 × 1.2 = 49.2, 41 × 1.1 = 45.1, 41 × 0.9 = 36.9, 41 × 0.8 = 32.8.
    expect(applyCondition(41, 2)).toBe(50);
    expect(applyCondition(41, 1)).toBe(46);
    expect(applyCondition(41, -1)).toBe(36);
    expect(applyCondition(41, -2)).toBe(32);
  });

  it('gives an exact result when the percentage is a whole number', () => {
    // In floating point, 50 × 1.1 is 55.00000000000001, and a round up
    // would give 56. The integer arithmetic gives 55.
    expect(applyCondition(50, 1)).toBe(55);
    expect(applyCondition(50, 2)).toBe(60);
    expect(applyCondition(50, -1)).toBe(45);
    expect(applyCondition(50, -2)).toBe(40);
    expect(applyCondition(70, 1)).toBe(77);
    expect(applyCondition(90, -1)).toBe(81);
  });

  // Each row: a base OVR at one end of a Tier range, then the real OVR at
  // -2, -1, 0, +1, and +2. The values are worked out by hand.
  const tierEnds: [number, number, number, number, number, number][] = [
    [30, 24, 27, 30, 33, 36],
    [39, 31, 35, 39, 43, 47],
    [40, 32, 36, 40, 44, 48],
    [49, 39, 44, 49, 54, 59],
    [50, 40, 45, 50, 55, 60],
    [59, 47, 53, 59, 65, 71],
    [60, 48, 54, 60, 66, 72],
    [69, 55, 62, 69, 76, 83],
    [70, 56, 63, 70, 77, 84],
    [79, 63, 71, 79, 87, 95],
    [80, 64, 72, 80, 88, 96],
    [89, 71, 80, 89, 98, 107],
    [90, 72, 81, 90, 99, 108],
    [99, 79, 89, 99, 109, 119],
  ];

  it('covers both ends of each Tier range', () => {
    const ends = Object.values(TIER_OVR_RANGES)
      .flatMap((range) => [range.min, range.max])
      .sort((a, b) => a - b);
    expect(tierEnds.map((row) => row[0])).toEqual(ends);
  });

  it.each(tierEnds)(
    'gives the real OVR of a base OVR of %i at each level',
    (base, ...real) => {
      CONDITION_LEVELS.forEach((level, index) => {
        expect(applyCondition(base, level)).toBe(real[index]);
      });
    }
  );

  it('can go out of the Tier range: 99 at +2 is 119, 30 at -2 is 24', () => {
    expect(applyCondition(99, 2)).toBe(119);
    expect(applyCondition(30, -2)).toBe(24);
  });

  it('gives the same result each time', () => {
    const results = Array.from({ length: 5 }, () => applyCondition(67, 1));
    expect(new Set(results)).toEqual(new Set([74]));
  });

  it('gives 0 for a base OVR of 0 at each level', () => {
    for (const level of CONDITION_LEVELS) expect(applyCondition(0, level)).toBe(0);
  });

  it('throws a RangeError for a base OVR that is not a whole number of 0 or more', () => {
    for (const base of [-1, 35.5, NaN, Infinity]) {
      expect(() => applyCondition(base, 1)).toThrow(RangeError);
    }
  });

  it('throws a RangeError for an unknown level', () => {
    expect(() => applyCondition(35, 3 as ConditionLevel)).toThrow(RangeError);
    expect(() => applyCondition(35, 0.5 as ConditionLevel)).toThrow(RangeError);
  });
});
