import { describe, expect, it, vi } from 'vitest';
import { createSeededRng } from '@/engine/rng';
import * as tierOvrModule from './index';
import {
  TIER_ORDER,
  TIER_OVR_RANGES,
  isOvrInTier,
  isTier,
  ovrAfterTierChange,
  rollOVR,
} from './index';

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
    expect(exportedNames.sort()).toEqual(
      [
        'TIER_ORDER',
        'TIER_OVR_RANGES',
        'isOvrInTier',
        'isTier',
        'ovrAfterTierChange',
        'rollOVR',
      ].sort()
    );
  });
});

describe('isTier', () => {
  it('accepts each tier letter', () => {
    for (const tier of TIER_ORDER) expect(isTier(tier)).toBe(true);
  });

  it('rejects a lower-case letter, an unknown letter, and a blank string', () => {
    for (const value of ['s', 'G', '', ' S']) expect(isTier(value)).toBe(false);
  });

  it('rejects a value that is not a string', () => {
    for (const value of [undefined, null, 1, ['S'], { tier: 'S' }]) {
      expect(isTier(value)).toBe(false);
    }
  });
});

describe('isOvrInTier', () => {
  it('accepts both ends of each tier range', () => {
    for (const tier of TIER_ORDER) {
      const range = TIER_OVR_RANGES[tier];
      expect(isOvrInTier(range.min, tier)).toBe(true);
      expect(isOvrInTier(range.max, tier)).toBe(true);
    }
  });

  it('rejects one step outside each end of each tier range', () => {
    for (const tier of TIER_ORDER) {
      const range = TIER_OVR_RANGES[tier];
      expect(isOvrInTier(range.min - 1, tier)).toBe(false);
      expect(isOvrInTier(range.max + 1, tier)).toBe(false);
    }
  });

  it('checks Tier C against 60 to 69, the Task 81 example', () => {
    expect(isOvrInTier(65, 'C')).toBe(true);
    expect(isOvrInTier(59, 'C')).toBe(false);
    expect(isOvrInTier(70, 'C')).toBe(false);
  });

  it('rejects a decimal, NaN, and Infinity', () => {
    for (const value of [65.5, NaN, Infinity, -Infinity]) {
      expect(isOvrInTier(value, 'C')).toBe(false);
    }
  });
});

describe('ovrAfterTierChange', () => {
  it('rolls a new OVR inside the new tier range for a different tier', () => {
    for (let seed = 0; seed < 200; seed++) {
      const ovr = ovrAfterTierChange(
        { tier: 'C', ovr: 64 },
        'S',
        createSeededRng(seed)
      );
      expect(isOvrInTier(ovr, 'S')).toBe(true);
    }
  });

  it('gives the same value as rollOVR with the same seed', () => {
    const ovr = ovrAfterTierChange({ tier: 'F', ovr: 33 }, 'B', createSeededRng(11));
    expect(ovr).toBe(rollOVR('B', createSeededRng(11)));
  });

  it('keeps the current OVR for the same tier, and does not use the rng', () => {
    const rng = vi.fn(createSeededRng(5));
    expect(ovrAfterTierChange({ tier: 'C', ovr: 67 }, 'C', rng)).toBe(67);
    expect(rng).not.toHaveBeenCalled();
  });

  it('is deterministic: the same seed gives the same result', () => {
    const a = ovrAfterTierChange({ tier: 'A', ovr: 85 }, 'D', createSeededRng(9));
    const b = ovrAfterTierChange({ tier: 'A', ovr: 85 }, 'D', createSeededRng(9));
    expect(a).toBe(b);
  });
});
