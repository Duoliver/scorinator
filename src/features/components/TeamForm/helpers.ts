import { TEAM_PALETTE, type SelectOption, type SwatchOption } from '@/design-system';
import { TIER_ORDER } from '@/engine/tier-ovr';

export const TIER_OPTIONS: SelectOption[] = TIER_ORDER.map((tier) => ({
  label: tier,
  value: tier,
}));

export const COLOUR_OPTIONS: SwatchOption[] = TEAM_PALETTE.map(({ name, hex }) => ({
  label: name,
  value: hex,
}));
