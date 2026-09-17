import type { PointsConfig } from '@/engine/standings';
import type { Fixture, Bye } from '@/engine/fixtures';
import type { TeamRecord } from '@/features/components';

/** One team as League Setup rolled it into a league: a reference back to
 * the shared team roster (`slug`) plus the OVR rolled for it at league
 * creation. See `app/state/leagueStore`'s `addLeague` for the roll. */
export interface LeagueTeam {
  slug: string;
  ovr: number;
}

/** A league as League Setup creates it. No results, no file path — those
 * belong to Task 15 (scorination) and Task 17 (Save/Load UI), both out of
 * scope here. `slug` is rolled once at creation, from the league name, the
 * same way `engine/identity`'s `slug()` already identifies a team — see
 * `app/state/leagueStore`'s `addLeague`. It is what League Detail (Task 25)
 * routes by. `fixtures`/`byes` are generated once at that same creation
 * step (Task 14), from `generateRoundRobin` — a team's slug is its
 * `TeamId` here, matching `adapters/json-io/types.ts`'s `SavedLeague`. */
export interface LeagueRecord {
  slug: string;
  name: string;
  homeAdvantage: boolean;
  points: PointsConfig;
  teams: LeagueTeam[];
  fixtures: Fixture<string>[];
  byes: Bye<string>[];
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
