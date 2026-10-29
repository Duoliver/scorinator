import type { PointsConfig } from '@/engine/standings';
import type { League, PhaseFormat } from './league';
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

/** Where a league stands, for its dashboard card (Task 76 d). `phase` and
 * `matchday` count from 1. Task 139 adds a bracket round. A league is never
 * in setup: "Create league" starts it (US-08.8). */
export type LeagueProgress =
  | { kind: 'phase'; phase: number; matchday: number; matchdays: number }
  | { kind: 'completed' };

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
  phaseFormats: PhaseFormat[];
  progress: LeagueProgress;
}

/** The part of the database that the app always loads (Task 76,
 * `PERSISTENCE.md` §2): the installation UUID, every Blueprint, and one
 * summary row for each wrapper. The installation UUID is made at the first
 * start and never changes (US-11.1). */
export interface Manifest {
  installationUuid: string;
  blueprints: TeamBlueprint[];
  wrappers: WrapperSummary[];
}
