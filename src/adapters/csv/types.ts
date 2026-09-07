import type { Tier } from '../../engine/tier-ovr/types';

export interface TeamCsvRecord {
  slug: string;
  name: string;
  colour: string;
  tier: Tier;
}
