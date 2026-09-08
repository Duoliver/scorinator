import type { Tier } from '../../engine/tier-ovr/types';
import type { PointsConfig, MatchResult } from '../../engine/standings/types';
import type { Fixture, Bye } from '../../engine/fixtures/types';

/** Bumped whenever the save-file shape changes. `parseLeague` rejects any
 * other value, rather than guessing at a migration. */
export const SAVE_FORMAT_VERSION = 1;

export interface SavedTeam {
  slug: string;
  name: string;
  colour: string;
  tier: Tier;
  /** The OVR already rolled for this team this season (spec: OVR is rolled
   * once per season and stays fixed). Saved as-is so a reload does not
   * re-roll it and silently change match odds. */
  ovr: number;
}

export interface SavedLeagueConfig {
  name: string;
  homeAdvantage: boolean;
  points: PointsConfig;
}

export interface SavedResult extends MatchResult<string> {
  matchday: number;
}

export interface SavedLeague {
  formatVersion: typeof SAVE_FORMAT_VERSION;
  league: SavedLeagueConfig;
  teams: SavedTeam[];
  fixtures: Fixture<string>[];
  byes: Bye<string>[];
  results: SavedResult[];
}
