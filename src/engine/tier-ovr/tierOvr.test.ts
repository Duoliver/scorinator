import { describe, expect, it } from 'vitest';
import { createSeededRng } from '../rng';
import * as tierOvrModule from './index';
import { TIER_ORDER, TIER_OVR_RANGES, rollOVR } from './index';

describe('TIER_OVR_RANGES', () => {
  it('gives every tier a defined range, S = 90-99 as the spec anchor', () => {
    expect(TIER_OVR_RANGES.S).toEqual({ min: 90, max: 99 });
  });

  it('orders tiers from S (highest) to F (lowest), each range below the last', () => {
    for (let i = 0; i < TIER_ORDER.length - 1; i++) {
      const higher = TIER_OVR_RANGES[TIER_ORDER[i]];
      const lower = TIER_OVR_RANGES[TIER_ORDER[i + 1]];
      expect(lower.max).toBeLessThan(higher.min);
    }
  });

  it('never overlaps two tiers’ ranges', () => {
    const ranges = TIER_ORDER.map((tier) => TIER_OVR_RANGES[tier]);
    for (let i = 0; i < ranges.length; i++) {
      for (let j = i + 1; j < ranges.length; j++) {
        const a = ranges[i];
        const b = ranges[j];
        const overlaps = a.min <= b.max && b.min <= a.max;
        expect(overlaps).toBe(false);
      }
    }
  });
});

describe('rollOVR', () => {
  it('always returns a value inside the rolled tier’s range, across many seeds', () => {
    for (const tier of TIER_ORDER) {
      const range = TIER_OVR_RANGES[tier];
      for (let seed = 0; seed < 200; seed++) {
        const value = rollOVR(tier, createSeededRng(seed));
        expect(value).toBeGreaterThanOrEqual(range.min);
        expect(value).toBeLessThanOrEqual(range.max);
      }
    }
  });

  it('is deterministic: the same seed gives the same roll', () => {
    const rollA = rollOVR('B', createSeededRng(7));
    const rollB = rollOVR('B', createSeededRng(7));
    expect(rollA).toBe(rollB);
  });

  it('rolls into the new tier’s range after a tier change, not the old one', () => {
    const rng = createSeededRng(3);
    const oldRoll = rollOVR('F', rng);
    const newRoll = rollOVR('S', rng);
    expect(oldRoll).toBeGreaterThanOrEqual(TIER_OVR_RANGES.F.min);
    expect(oldRoll).toBeLessThanOrEqual(TIER_OVR_RANGES.F.max);
    expect(newRoll).toBeGreaterThanOrEqual(TIER_OVR_RANGES.S.min);
    expect(newRoll).toBeLessThanOrEqual(TIER_OVR_RANGES.S.max);
  });

  it('is the only exported way to produce an OVR value (no direct setter)', () => {
    const exportedNames = Object.keys(tierOvrModule);
    expect(exportedNames).toEqual(['TIER_ORDER', 'TIER_OVR_RANGES', 'rollOVR']);
  });
});
