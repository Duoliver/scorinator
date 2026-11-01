import type { Bye, PhaseFixture } from '@/engine/round-robin';
import type { MatchResult, PointsConfig } from '@/engine/standings';
import type { Tier } from '@/engine/tier-ovr';

// ---------------------------------------------------------------------------
// MVP2 database files (Task 106): `manifest.json` and `wrapper-{uuid}.json`.
// These are the file shapes. `app/data` maps them to the domain types
// (Task 108). Keys are camelCase, also the provenance keys.
// ---------------------------------------------------------------------------

/** The format version of each MVP2 file. The MVP1 save file has version 1.
 * A field that a later task adds with a default keeps this version. A
 * change that an older parser cannot read raises it. */
export const DATABASE_FORMAT_VERSION = 2;

export interface SavedProvenance {
  createdByInstallation: string;
  lastModifiedByInstallation: string;
}

export interface SavedBlueprint extends SavedProvenance {
  uuid: string;
  slug: string;
  name: string;
  colour: string;
  tier: Tier;
  location: string;
  trigrams: string[];
}

export type SavedPhaseFormat = 'round-robin';

export type SavedLeagueProgress =
  | { kind: 'phase'; phase: number; matchday: number; matchdays: number }
  | { kind: 'completed' };

/** The manifest row of one wrapper: the fields of its dashboard card. */
export interface SavedWrapperSummary {
  uuid: string;
  contentType: 'league';
  name: string;
  teamCount: number;
  homeAdvantage: boolean;
  points: PointsConfig;
  phaseFormats: SavedPhaseFormat[];
  progress: SavedLeagueProgress;
}

export interface SavedManifest {
  kind: 'manifest';
  formatVersion: typeof DATABASE_FORMAT_VERSION;
  installationUuid: string;
  blueprints: SavedBlueprint[];
  wrappers: SavedWrapperSummary[];
}

export interface SavedInstance {
  blueprintUuid: string;
  slug: string;
  name: string;
  colour: string;
  tier: Tier;
  ovr: number;
  trigram: string;
}

export interface SavedPhaseResult extends MatchResult<string> {
  fixtureId: string;
}

export interface SavedRoundRobinPhase {
  format: 'round-robin';
  fixtures: PhaseFixture<string>[];
  byes: Bye<string>[];
  results: SavedPhaseResult[];
}

export type SavedPhase = SavedRoundRobinPhase;

/** The league inside a wrapper file. */
export interface SavedWrapperLeague extends SavedProvenance {
  uuid: string;
  name: string;
  homeAdvantage: boolean;
  points: PointsConfig;
  phases: SavedPhase[];
}

export interface SavedWrapper {
  kind: 'wrapper';
  formatVersion: typeof DATABASE_FORMAT_VERSION;
  uuid: string;
  teams: SavedInstance[];
  content: SavedWrapperLeague;
}
