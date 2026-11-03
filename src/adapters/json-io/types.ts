import type { BracketPlan, GroupBye, Legs, PhasePlan } from '@/engine/phases';
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
 * change that an older parser cannot read raises it. Version 3 (Task 176)
 * adds the phase plans, the legs, and the Groups phase. The parsers also
 * read version 2, with defaults. */
export const DATABASE_FORMAT_VERSION = 3;

/** The oldest format version the parsers read. */
export const OLDEST_DATABASE_FORMAT_VERSION = 2;

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

export type SavedPhaseFormat = 'round-robin' | 'groups';

/** The phase plan of the `engine/phases` type (Task 126): the format, the
 * legs, the group setting, and the advancement. */
export type SavedPhasePlan = PhasePlan;

/** One phase of a manifest row, from its plan (Task 176 choice 4). A
 * bracket has no legs. */
export type SavedPhaseSummary = { format: SavedPhaseFormat; legs: Legs } | BracketPlan;

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
  phases: SavedPhaseSummary[];
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
  legs: Legs;
  fixtures: PhaseFixture<string>[];
  byes: Bye<string>[];
  results: SavedPhaseResult[];
}

/** A Groups phase: the draw as Blueprint UUIDs, one list for each group,
 * and the byes with their group number. */
export interface SavedGroupsPhase {
  format: 'groups';
  legs: Legs;
  groups: string[][];
  fixtures: PhaseFixture<string>[];
  byes: GroupBye<string>[];
  results: SavedPhaseResult[];
}

export type SavedPhase = SavedRoundRobinPhase | SavedGroupsPhase;

/** The league inside a wrapper file. */
export interface SavedWrapperLeague extends SavedProvenance {
  uuid: string;
  name: string;
  homeAdvantage: boolean;
  points: PointsConfig;
  /** The whole phase chain, fixed at "Create league". */
  plans: SavedPhasePlan[];
  /** The started phases only, in order. */
  phases: SavedPhase[];
}

export interface SavedWrapper {
  kind: 'wrapper';
  formatVersion: typeof DATABASE_FORMAT_VERSION;
  uuid: string;
  teams: SavedInstance[];
  content: SavedWrapperLeague;
}
