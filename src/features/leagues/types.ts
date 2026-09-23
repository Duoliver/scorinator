import type { PointsConfig, MatchResult } from '@/engine/standings';
import type { Fixture, Bye } from '@/engine/fixtures';
import type { TeamRecord } from '@/features/components';

/** One team as League Setup rolled it into a league: a reference back to
 * the shared team roster (`slug`) plus the OVR rolled for it at league
 * creation. See `app/state/leagueStore`'s `addLeague` for the roll. */
export interface LeagueTeam {
  slug: string;
  ovr: number;
}

/** One scorinated match. Same shape as `adapters/json-io/types.ts`'s
 * `SavedResult`, but owned by the domain layer here, not the persistence
 * layer — `features/` never imports `adapters/` directly, per
 * `module-boundaries.md`. `matchday` plus `home`/`away` (both team slugs)
 * uniquely identify which fixture this result belongs to. */
export interface LeagueResult extends MatchResult<string> {
  matchday: number;
}

/** A league as League Setup creates it. No file path — where it was last
 * saved lives in `app/state/fileStore` (Task 17), since a path is session
 * state, not part of the save file this record mirrors. `slug` is rolled once at
 * creation, from the league name, the same way `engine/identity`'s
 * `slug()` already identifies a team — see `app/state/leagueStore`'s
 * `addLeague`. It is what League Detail (Task 25) routes by.
 * `fixtures`/`byes` are generated once at that same creation step (Task
 * 14), from `generateRoundRobin` — a team's slug is its `TeamId` here,
 * matching `adapters/json-io/types.ts`'s `SavedLeague`. `results` starts
 * empty and fills in as Fixtures' Scorinate actions play each match (Task
 * 15) — see `app/state/leagueStore`'s `scorinateFixture`. */
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
