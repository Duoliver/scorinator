import { TIER_OVR_RANGES, type Tier } from '@/engine/tier-ovr';

export const NAME_TAKEN = 'Another team of this Season has this name.';
export const TRIGRAM_INVALID = 'Use 3 letters or digits.';
export const TRIGRAM_TAKEN = 'Another team of this Season has this trigram.';

/** "70 to 79": the OVR range of a Tier, for the OVR label and its error. */
export function formatOvrRange(tier: Tier): string {
  return `${TIER_OVR_RANGES[tier].min} to ${TIER_OVR_RANGES[tier].max}`;
}

/** The note at the top of the drawer: the leagues that the change reaches. */
export function formatReachNote(leagueNames: readonly string[]): string {
  if (leagueNames.length === 0) return 'The team is in no league of this Season yet.';
  return `The change reaches every league of this Season: ${leagueNames.join(', ')}.`;
}
