import type { Bye, Fixture } from '@/engine/round-robin';
import type { MatchResult, PointsConfig } from '@/engine/standings';
import type { TeamRecord } from './team';

/** One team of a league: a reference to the roster team (`slug`), plus the
 * OVR rolled for it when the league was created. */
export interface LeagueTeam {
  slug: string;
  ovr: number;
}

/** One scorinated match. `matchday` plus `home` and `away` (both team slugs)
 * identify the fixture it belongs to. The save file has its own copy of this
 * shape (`SavedResult` in `adapters/json-io`), so the two layers can change
 * apart. */
export interface LeagueResult extends MatchResult<string> {
  matchday: number;
}

/** A league in memory. It mirrors the league save file, so it holds no file
 * path: a path is session state, kept in `app/state/fileStore`.
 *
 * - `slug` comes from the league name, once, at creation. Routes, save
 *   paths, and every action find a league by it, so two leagues never share
 *   one.
 * - `fixtures` and `byes` come from `generateRoundRobin`, once, at
 *   creation. A team's slug is its `TeamId`.
 * - `results` starts empty and gets one entry for each scorinated match. */
export interface LeagueRecord {
  slug: string;
  name: string;
  homeAdvantage: boolean;
  points: PointsConfig;
  teams: LeagueTeam[];
  fixtures: Fixture<string>[];
  byes: Bye<string>[];
  results: LeagueResult[];
}

/** What it takes to create a league. `teams` holds the full roster records,
 * with their Tier, because the OVR roll at creation needs the Tier. */
export interface CreateLeagueInput {
  name: string;
  homeAdvantage: boolean;
  points: PointsConfig;
  teams: readonly TeamRecord[];
}
