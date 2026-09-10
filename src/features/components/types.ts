import type { Tier } from '../../engine/tier-ovr';

/** A team as the shared in-memory team roster holds it (see
 * `app/state/teamsStore`), used by both the Team Management and League
 * Setup screens. No OVR — OVR is rolled per league, at league creation
 * (see `features/leagues`), not on this record. No UUID either —
 * `engine/identity` only has `slug()` so far; the later provenance system
 * owns cross-file identity. */
export interface TeamRecord {
  slug: string;
  name: string;
  colour: string;
  tier: Tier;
}
