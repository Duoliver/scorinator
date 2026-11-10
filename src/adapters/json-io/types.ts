import type { BracketTieResult } from '@/engine/bracket';
import type { GroupBye, Legs, PhaseFormat, PhasePlan } from '@/engine/phases';
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
 * adds the phase plans, the legs, and the Groups phase. Version 4 (Task 139)
 * adds the bracket phase, the bracket plan rules, and the bracket progress.
 * Task 155 adds an optional zone list to a plan, with no version change.
 * The parsers also read versions 2 and 3, with defaults. */
export const DATABASE_FORMAT_VERSION = 4;

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

export type SavedPhaseFormat = Exclude<PhaseFormat, 'bracket'>;

/** The phase plan of the `engine/phases` type (Task 126): the format, the
 * legs, the group setting, and the advancement. */
export type SavedPhasePlan = PhasePlan;

/** One phase of a manifest row, from its plan (Task 176 choice 4). A
 * bracket has no legs, and its rules stay in the wrapper file. */
export type SavedPhaseSummary =
  { format: SavedPhaseFormat; legs: Legs } | { format: 'bracket' };

/** `round` is the slot count of the current bracket round (Task 139). */
export type SavedLeagueProgress =
  | { kind: 'phase'; phase: number; matchday: number; matchdays: number }
  | { kind: 'bracket'; phase: number; round: number }
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

/** One played tie of a bracket: the engine result, with its tie id. */
export type SavedTieResult = BracketTieResult<string>;

/** A bracket phase (Task 139 choice 1): the seeds in seed order, the bye
 * teams, and the played ties. The tree is not stored. */
export interface SavedBracketPhase {
  format: 'bracket';
  seeds: string[];
  byeTeams: string[];
  results: SavedTieResult[];
  /** The Task 185 rule: no same-group first-round tie. Not there in a
   * bracket that started before, which keeps its pairs. */
  avoidGroupTies?: boolean;
}

export type SavedPhase = SavedRoundRobinPhase | SavedGroupsPhase | SavedBracketPhase;

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

/** One league with its Instances: the body of a wrapper file, and one item
 * of a league file (Task 145). */
export interface SavedLeagueEntry {
  uuid: string;
  teams: SavedInstance[];
  content: SavedWrapperLeague;
}

export interface SavedWrapper extends SavedLeagueEntry {
  kind: 'wrapper';
  formatVersion: typeof DATABASE_FORMAT_VERSION;
}

// ---------------------------------------------------------------------------
// MVP2 export files (Task 145): the league file and the Blueprint file of the
// File module (US-10.1, US-10.2). They use the format version of the
// database files (choice 2).
// ---------------------------------------------------------------------------

/** A league file: one or many leagues, and one list of the Blueprint
 * snapshots that their Instances name (choice 1). */
export interface SavedLeagueFile {
  kind: 'leagues';
  formatVersion: typeof DATABASE_FORMAT_VERSION;
  leagues: SavedLeagueEntry[];
  blueprints: SavedBlueprint[];
}

/** A Blueprint file: every Blueprint, with its UUID and provenance. */
export interface SavedBlueprintFile {
  kind: 'blueprints';
  formatVersion: typeof DATABASE_FORMAT_VERSION;
  blueprints: SavedBlueprint[];
}

/** The `kind` of each MVP2 file. */
export const SavedFileKind = {
  MANIFEST: 'manifest',
  WRAPPER: 'wrapper',
  LEAGUES: 'leagues',
  BLUEPRINTS: 'blueprints',
} as const;
export type SavedFileKind = (typeof SavedFileKind)[keyof typeof SavedFileKind];
