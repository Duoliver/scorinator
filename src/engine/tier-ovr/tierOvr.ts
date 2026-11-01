import type { Rng } from '@/engine/rng';
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

/** True for one of the seven tier letters, upper case only. A file parser
 * calls it on a value it reads, before it trusts the value as a `Tier`. */
export function isTier(value: unknown): value is Tier {
  return typeof value === 'string' && (TIER_ORDER as readonly string[]).includes(value);
}

/**
 * Rolls a team's OVR from its Tier's range. Tier is always the source of
 * truth (spec §1), so `engine/tier-ovr` exports no direct OVR setter. An
 * OVR comes from this roll, or from a user override that `isOvrInTier`
 * accepts (Task 81). For a Tier change, call `ovrAfterTierChange`.
 */
export function rollOVR(tier: Tier, rng: Rng): number {
  const range = TIER_OVR_RANGES[tier];
  const span = range.max - range.min + 1;
  return range.min + Math.floor(rng() * span);
}

/** True for a whole number inside the Tier's range, both ends included.
 * The Edit drawer checks an OVR override with it (Task 81, US-08.4). */
export function isOvrInTier(ovr: number, tier: Tier): boolean {
  const range = TIER_OVR_RANGES[tier];
  return Number.isInteger(ovr) && ovr >= range.min && ovr <= range.max;
}

/**
 * The OVR after the user picks `newTier` in the Edit drawer (Task 81). A
 * different Tier rolls a new OVR from its range. The same Tier keeps the
 * current OVR, so an override stays, and the `rng` is not used.
 */
export function ovrAfterTierChange(
  current: { tier: Tier; ovr: number },
  newTier: Tier,
  rng: Rng
): number {
  return newTier === current.tier ? current.ovr : rollOVR(newTier, rng);
}
