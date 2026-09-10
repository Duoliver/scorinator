import type { PointsConfig } from '../../engine/standings';
import type { TeamRecord } from '../components';

/** One team as League Setup rolled it into a league: a reference back to
 * the shared team roster (`slug`) plus the OVR rolled for it at league
 * creation. See `app/state/leagueStore`'s `addLeague` for the roll. */
export interface LeagueTeam {
  slug: string;
  ovr: number;
}

/** A league as League Setup creates it. No fixtures, no results, no file
 * path — those belong to Task 14 (fixture generation) and Task 17
 * (Save/Load UI), both out of scope here. */
export interface LeagueRecord {
  name: string;
  homeAdvantage: boolean;
  points: PointsConfig;
  teams: LeagueTeam[];
}

/** What `LeagueSetupScreen` assembles across its three steps and hands to
 * `useLeagueStore().addLeague()` on submit. `teams` here is the full
 * selected `TeamRecord`s (Tier included, OVR not yet rolled) — `addLeague`
 * is what turns this into a `LeagueRecord`'s `LeagueTeam[]`. */
export interface CreateLeagueInput {
  name: string;
  homeAdvantage: boolean;
  points: PointsConfig;
  teams: readonly TeamRecord[];
}
