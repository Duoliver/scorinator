import type { Tier } from '@/engine/tier-ovr';

/** A team in the shared in-memory roster. No OVR: a league rolls an OVR for
 * each of its teams when it is created, so the same team can have a
 * different OVR in each league. No UUID either: `engine/identity` only has
 * `slug()` so far, and the later provenance system owns cross-file identity. */
export interface TeamRecord {
  slug: string;
  name: string;
  colour: string;
  tier: Tier;
}
