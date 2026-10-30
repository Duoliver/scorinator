import type { Tier } from '@/engine/tier-ovr';
import type { Provenance } from './provenance';

/**
 * A reusable team in the Teams module (US-09.1). It belongs to no league.
 *
 * - `uuid` is permanent: no edit, rename, slug regenerate, export, or import
 *   changes it (US-11.1).
 * - `slug` is unique among the Blueprints, fixed at create (US-09.5).
 * - `location` is a free label, `''` when empty, at most 40 characters
 *   (US-09.3). It is not a City.
 * - `trigrams` is an ordered list of up to 5 three-character codes. `[]`
 *   means the code made from the name (US-09.6).
 *
 * No City and no Crest: those are MVP3 (Task 74).
 */
export interface TeamBlueprint extends Provenance {
  uuid: string;
  slug: string;
  name: string;
  colour: string;
  tier: Tier;
  location: string;
  trigrams: string[];
}

/**
 * The state of one team in one league (US-09.2). Adding a Blueprint to a
 * league copies its name, colour, slug, and Tier, and rolls `ovr` from the
 * Tier (Task 81). After that, a Blueprint edit and an Instance edit never
 * change each other.
 *
 * An Instance has no UUID of its own: `blueprintUuid` is its identity in the
 * league, also after the Blueprint is deleted (US-09.4, US-11.1). It does not
 * copy the location: a league screen reads that from the Blueprint (US-09.3).
 */
export interface TeamInstance {
  blueprintUuid: string;
  slug: string;
  name: string;
  colour: string;
  tier: Tier;
  ovr: number;
}

/** The four team fields that the team form edits: slug, name, colour, and
 * Tier. A Blueprint has them all, so a Blueprint fits where `TeamFields` is
 * asked for. A team list file can also hold a location and trigrams
 * (Task 117). */
export type TeamFields = Pick<TeamBlueprint, 'slug' | 'name' | 'colour' | 'tier'>;
