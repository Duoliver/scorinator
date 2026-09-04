import type { Rng } from '../rng';
import type { Tier, TierOvrRange } from './types';

export const TIER_ORDER: readonly Tier[] = ['S', 'A', 'B', 'C', 'D', 'E', 'F'];

/**
 * Default Tier -> OVR range table (MVP1). The spec gives only one anchor
 * point (S = 90-99) and calls the rest a default; this table fills the gap
 * with seven even, non-overlapping 10-point bands. Flagged in the Task 2
 * decision log rather than picked silently, per `tdd.md`. Story Mode
 * (later MVP) makes this configurable per season; MVP1 ships this table
 * as a fixed constant.
 */
export const TIER_OVR_RANGES: Readonly<Record<Tier, TierOvrRange>> = {
  S: { min: 90, max: 99 },
  A: { min: 80, max: 89 },
  B: { min: 70, max: 79 },
  C: { min: 60, max: 69 },
  D: { min: 50, max: 59 },
  E: { min: 40, max: 49 },
  F: { min: 30, max: 39 },
};

/**
 * Rolls a team's OVR from its Tier's range. This is the only supported way
 * to produce an OVR value — Tier is always the source of truth (spec §1),
 * so `engine/tier-ovr` deliberately exports no direct OVR setter. Call this
 * again whenever a team's Tier changes, not only at season start.
 */
export function rollOVR(tier: Tier, rng: Rng): number {
  const range = TIER_OVR_RANGES[tier];
  const span = range.max - range.min + 1;
  return range.min + Math.floor(rng() * span);
}
