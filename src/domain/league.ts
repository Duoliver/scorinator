import type { Bye, Fixture, PhaseFixture } from '@/engine/round-robin';
import type { MatchResult, PointsConfig } from '@/engine/standings';
import type { Provenance } from './provenance';
import type { TeamRecord } from './team';

/** One team of a league: a reference to the roster team (`slug`), plus the
 * OVR rolled for it when the league was created.
 *
 * @deprecated MVP1 shape. Use `TeamInstance` in new code. Task 109 removes it.
 */
export interface LeagueTeam {
  slug: string;
  ovr: number;
}

/** One scorinated match. `matchday` plus `home` and `away` (both team slugs)
 * identify the fixture it belongs to. The save file has its own copy of this
 * shape (`SavedResult` in `adapters/json-io`), so the two layers can change
 * apart.
 *
 * @deprecated MVP1 shape. Use `PhaseResult` in new code. Task 109 removes it.
 */
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
 * - `results` starts empty and gets one entry for each scorinated match.
 *
 * @deprecated MVP1 shape. Use `League` in new code. Task 109 removes it.
 */
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
 * with their Tier, because the OVR roll at creation needs the Tier.
 *
 * @deprecated MVP1 shape. Task 108 makes the v2 create input. Task 109 removes it.
 */
export interface CreateLeagueInput {
  name: string;
  homeAdvantage: boolean;
  points: PointsConfig;
  teams: readonly TeamRecord[];
}

/** The format of a phase (US-01.2). M1 has the two-way round robin only.
 * Task 123 adds single duels, Task 126 the groups, and Task 137 the
 * bracket. */
export type PhaseFormat = 'round-robin';

/** One scorinated match of a phase. `fixtureId` finds its fixture (Task 77):
 * code treats the id as opaque and never parses it. `home` and `away` are
 * Blueprint UUIDs, so the engine standings read the result as it is. */
export interface PhaseResult extends MatchResult<string> {
  fixtureId: string;
}

/**
 * A two-way round-robin phase (MVP1 §1 Fixtures). The schedule comes from
 * `generateRoundRobin` when the phase starts, with ids from
 * `assignFixtureIds` (Task 105), and `results` gets one entry
 * for each scorinated match. Fixtures, byes, and results name a team by its
 * Blueprint UUID (US-11.1). Points reset in each phase (US-07.1).
 */
export interface RoundRobinPhase {
  format: 'round-robin';
  fixtures: PhaseFixture<string>[];
  byes: Bye<string>[];
  results: PhaseResult[];
}

/** One phase of a league. A union on `format`: each later phase format adds
 * a member (see `PhaseFormat`). */
export type Phase = RoundRobinPhase;

/**
 * A league (US-01.1, US-11.1). It holds no teams: its wrapper holds the
 * Instances (`LeagueWrapper`).
 *
 * - `uuid` is permanent, made at "Create league" (US-08.8). Routes use it,
 *   so a league has no slug.
 * - `points` is one points system for the whole league (US-01.1).
 * - `phases` runs in order. "Create league" builds phase 1.
 */
export interface League extends Provenance {
  uuid: string;
  name: string;
  homeAdvantage: boolean;
  points: PointsConfig;
  phases: Phase[];
}
