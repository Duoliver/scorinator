import { TEAM_PALETTE, type SelectOption, type SwatchOption } from '@/design-system';
import { slug } from '@/engine/identity';
import { TIER_ORDER, type Tier } from '@/engine/tier-ovr';

export const TIER_OPTIONS: SelectOption[] = TIER_ORDER.map((tier) => ({
  label: tier,
  value: tier,
}));

export const COLOUR_OPTIONS: SwatchOption[] = TEAM_PALETTE.map(({ name, hex }) => ({
  label: name,
  value: hex,
}));

export const DEFAULT_TIER: Tier = 'C';

export const TEAM_NAME_INVALID =
  'Enter a team name with at least one letter or number.';

/** The slug a name gives, or an empty string while the name gives none.
 * `slug()` throws for a blank or symbols-only name, and the preview must not
 * throw on a keystroke. */
export function getSlugPreview(name: string): string {
  try {
    return slug(name);
  } catch {
    return '';
  }
}
