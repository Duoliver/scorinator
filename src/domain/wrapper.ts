import type { PointsConfig } from '@/engine/standings';
import type { Legs } from '@/engine/phases';
import type { League, PhaseFormat } from './league';
import type { Season } from './season';
import type { TeamBlueprint, TeamInstance } from './team';

/**
 * The owner of the Team Instances (`PERSISTENCE.md` §2a). Its `content` is a
 * League in MVP2, and a Season from MVP3. Its `uuid` is the UUID of the one
 * thing it holds, so a league wrapper has the league UUID. The app saves each
 * wrapper to its own file.
 */
export interface InstanceWrapper<T> {
  uuid: string;
  teams: TeamInstance[];
  content: T;
}

/** The wrapper of one standalone league. In MVP2 each league has its own
 * wrapper, so two leagues never share an Instance (Task 74). */
export type LeagueWrapper = InstanceWrapper<League>;

/** The wrapper of one Season (PERSISTENCE.md §2a). Its `uuid` is the Season
 * UUID. Its `teams` are the Season roster, one Instance for each Blueprint,
 * shared by every league of the Season (US-13.4). */
export type SeasonWrapper = InstanceWrapper<Season>;

/** Where a league stands, for its dashboard card (Task 76 d). `phase` and
 * `matchday` count from 1. In a bracket, `round` is the slot count of the
 * current round, 8 for the Quarter-finals (Task 139 choice 6). A league is
 * never in setup: "Create league" starts it (US-08.8). */
export type LeagueProgress =
  | { kind: 'phase'; phase: number; matchday: number; matchdays: number }
  | { kind: 'bracket'; phase: number; round: number }
  | { kind: 'completed' };

/** One phase of a manifest row, from its plan (Task 176 choice 4). The
 * dashboard card shows "Round robin (single duels)" from the legs, and the
 * short names of the phases not started yet. A bracket has no legs, and its
 * rules stay in the wrapper file. */
export type PhaseSummary =
  { format: Exclude<PhaseFormat, 'bracket'>; legs: Legs } | { format: 'bracket' };

/**
 * The manifest row of one wrapper: the fields of its dashboard card, so the
 * dashboard does not load every wrapper (Task 76 d). One pure function
 * computes the row from the league (Task 108). Nothing edits it by hand.
 */
export interface WrapperSummary {
  uuid: string;
  contentType: 'league';
  name: string;
  teamCount: number;
  homeAdvantage: boolean;
  points: PointsConfig;
  phases: PhaseSummary[];
  progress: LeagueProgress;
}

/** The manifest row of one Season: the fields of its card on the Seasons
 * list, so the list does not load every Season wrapper. The Season leagues
 * have no rows of their own (Task 207 choice 5). */
export interface SeasonSummary {
  uuid: string;
  name: string;
  year: string;
  finished: boolean;
  leagueCount: number;
  teamCount: number;
  playoffCount: number;
}

/** The part of the database that the app always loads (Task 76,
 * `PERSISTENCE.md` §2): the installation UUID, every Blueprint, one summary
 * row for each standalone league, and one for each Season (Task 209). The installation UUID is made at the first
 * start and never changes (US-11.1). */
export interface Manifest {
  installationUuid: string;
  blueprints: TeamBlueprint[];
  wrappers: WrapperSummary[];
  seasons: SeasonSummary[];
}
