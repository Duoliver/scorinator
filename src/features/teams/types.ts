import type { Tier } from '../../engine/tier-ovr';

/** A team as this screen's in-memory roster holds it. No OVR — OVR is
 * rolled at season start, not at team creation, so it has no place on this
 * form. No UUID either — `engine/identity` only has `slug()` so far; the
 * later provenance system owns cross-file identity. */
export interface TeamRecord {
  slug: string;
  name: string;
  colour: string;
  tier: Tier;
}
