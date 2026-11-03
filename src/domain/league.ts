import type { GroupBye, Legs, PhasePlan } from '@/engine/phases';
import type { Bye, PhaseFixture } from '@/engine/round-robin';
import type { MatchResult, PointsConfig } from '@/engine/standings';
import type { Provenance } from './provenance';

/** The format of a started phase (US-01.2). The legs of a round robin or
 * Groups phase say two-way or single duels (Task 176). Task 139 adds the
 * bracket. */
export type PhaseFormat = 'round-robin' | 'groups';

/** One scorinated match of a phase. `fixtureId` finds its fixture (Task 77):
 * code treats the id as opaque and never parses it. `home` and `away` are
 * Blueprint UUIDs, so the engine standings read the result as it is. */
export interface PhaseResult extends MatchResult<string> {
  fixtureId: string;
}

/**
 * A round-robin phase (MVP1 §1 Fixtures, US-06.1). The schedule comes from
 * `generateRoundRobin` (two-way) or `generateSingleDuels` (single duels)
 * when the phase starts, with ids from `assignFixtureIds` (Task 105), and
 * `results` gets one entry for each scorinated match. Fixtures, byes, and
 * results name a team by its Blueprint UUID (US-11.1). Points reset in each
 * phase (US-07.1).
 */
export interface RoundRobinPhase {
  format: 'round-robin';
  legs: Legs;
  fixtures: PhaseFixture<string>[];
  byes: Bye<string>[];
  results: PhaseResult[];
}

/**
 * A Groups phase (US-02.1, US-02.2): `groups` is the draw, one list of
 * Blueprint UUIDs for each group, in group order (index 0 is Group A). The
 * fixture ids carry the group number, and each bye has its group number
 * (`buildPhase`, Task 175).
 */
export interface GroupsPhase {
  format: 'groups';
  legs: Legs;
  groups: string[][];
  fixtures: PhaseFixture<string>[];
  byes: GroupBye<string>[];
  results: PhaseResult[];
}

/** One started phase of a league. A union on `format` (see `PhaseFormat`). */
export type Phase = RoundRobinPhase | GroupsPhase;

/**
 * A league (US-01.1, US-11.1). It holds no teams: its wrapper holds the
 * Instances (`LeagueWrapper`).
 *
 * - `uuid` is permanent, made at "Create league" (US-08.8). Routes use it,
 *   so a league has no slug.
 * - `points` is one points system for the whole league (US-01.1).
 * - `plans` is the whole phase chain, fixed at "Create league" (Task 176).
 * - `phases` holds the started phases only, in order. "Create league"
 *   builds phase 1, and each later phase builds at its own start (US-07.3).
 *   The current phase is the last one.
 */
export interface League extends Provenance {
  uuid: string;
  name: string;
  homeAdvantage: boolean;
  points: PointsConfig;
  plans: PhasePlan[];
  phases: Phase[];
}
