import type { Bye, PhaseFixture } from '@/engine/round-robin';
import type { MatchResult, PointsConfig } from '@/engine/standings';
import type { Provenance } from './provenance';

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
