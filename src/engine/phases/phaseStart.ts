import type { Rng } from '@/engine/rng';
import {
  assignFixtureIds,
  drawGroups,
  generateRoundRobin,
  generateSingleDuels,
  groupCountFor,
  type RoundRobinSchedule,
} from '@/engine/round-robin';
import {
  orderAcrossGroups,
  pickBestOfPlace,
  type LotOf,
  type StandingsRow,
} from '@/engine/standings';
import { defaultByeTeams, drawBracketSeeds } from '@/engine/bracket';
import {
  type BuiltPhase,
  type GroupBye,
  Legs,
  type PhasePlan,
  PhaseFormat,
} from './types';

/**
 * The qualifiers of a finished phase, in seed order (US-01.4, US-01.6,
 * Task 78 rule 3). Pass the standings tables that the caller made with
 * `calculateStandings` and the lots (Task 175 choice 1): one table for a
 * round robin, one table for each group, in group order.
 *
 * - Round robin: the top N of the table, in table order.
 * - Groups: all group winners, then all runners-up, and so on to place N.
 *   Each place is in the `orderAcrossGroups` order. Then the best M of
 *   place N + 1 (`pickBestOfPlace`).
 *
 * Throws a `RangeError` for a plan with no advancement, a round robin with
 * other than one table, or a table with fewer rows than the places it
 * needs.
 */
export function pickQualifiers<TeamId>(
  plan: PhasePlan,
  tables: readonly (readonly StandingsRow<TeamId>[])[],
  lotOf?: LotOf<TeamId>
): TeamId[] {
  if (plan.format === PhaseFormat.BRACKET || !plan.advance) {
    throw new RangeError('pickQualifiers needs a phase with an advancement.');
  }

  if (plan.format === PhaseFormat.ROUND_ROBIN) {
    const { top } = plan.advance;
    if (tables.length !== 1 || tables[0].length < top) {
      throw new RangeError(
        `pickQualifiers needs one round-robin table with ${top} rows or more.`
      );
    }
    return tables[0].slice(0, top).map((row) => row.team);
  }

  const { top, bestOfNext } = plan.advance;
  const seeds: TeamId[] = [];
  for (let place = 1; place <= top; place++) {
    const rows = tables.map((table, i) => {
      const row = table[place - 1];
      if (!row) {
        throw new RangeError(
          `pickQualifiers got group ${i + 1} with ${table.length} rows. Place ${place} needs ${place} rows or more.`
        );
      }
      return row;
    });
    seeds.push(...orderAcrossGroups(rows, lotOf).map((row) => row.team));
  }
  if (bestOfNext > 0) {
    seeds.push(
      ...pickBestOfPlace(tables, top + 1, bestOfNext, lotOf).map((row) => row.team)
    );
  }
  return seeds;
}

/**
 * Builds a phase at its start (US-07.3, Task 175 choice 2). `phase` counts from 1 and goes into each fixture id (Task 77).
 *
 * - Round robin: one schedule of `teams`, in the given order (the seed
 *   order of the qualifiers, or the wizard order for phase 1). The ids use
 *   group 1.
 * - Groups: one schedule for each group (US-02.2), with the group number in
 *   each fixture id and bye. With `groups`, the build uses that draw as it
 *   is: the wizard draw of phase 1, or a draw after a Shuffle or a move.
 *   Without `groups`, it draws `teams` again (`drawGroups`, with
 *   `groupCountFor`).
 *
 * The `rng` draws first (when there is no `groups`), then makes each group
 * schedule in group order (choice 5). The same seed gives the same build.
 * The fixtures come in group order, then matchday order (choice 3).
 *
 * - Bracket (Task 139 choice 4): as phase 1, the `rng` draws the seeds
 *   (US-04.2). After that, `teams` is the seed order. The top seeds get the
 *   byes (`defaultByeTeams`).
 *
 * Throws the generator `RangeError` for a schedule of fewer than 2 teams,
 * and the `bracketSlotCount` one for a bracket of fewer than 2 teams.
 */
export function buildPhase<TeamId>(
  plan: PhasePlan,
  phase: number,
  teams: readonly TeamId[],
  rng: Rng,
  groups?: readonly (readonly TeamId[])[]
): BuiltPhase<TeamId> {
  if (plan.format === PhaseFormat.BRACKET) {
    const seeds = phase === 1 ? drawBracketSeeds(teams, rng) : [...teams];
    return { format: PhaseFormat.BRACKET, seeds, byeTeams: defaultByeTeams(seeds) };
  }

  if (plan.format === PhaseFormat.ROUND_ROBIN) {
    const schedule = makeSchedule(plan.legs, teams, rng);
    return {
      format: PhaseFormat.ROUND_ROBIN,
      legs: plan.legs,
      fixtures: assignFixtureIds(schedule.fixtures, { phase, group: 1 }),
      byes: schedule.byes,
    };
  }

  const drawn = groups
    ? groups.map((group) => [...group])
    : drawGroups(teams, groupCountFor(teams.length, plan.grouping), rng);
  const built: BuiltPhase<TeamId> = {
    format: PhaseFormat.GROUPS,
    legs: plan.legs,
    groups: drawn,
    fixtures: [],
    byes: [],
  };
  drawn.forEach((members, index) => {
    const group = index + 1;
    const schedule = makeSchedule(plan.legs, members, rng);
    built.fixtures.push(...assignFixtureIds(schedule.fixtures, { phase, group }));
    built.byes.push(
      ...schedule.byes.map((bye): GroupBye<TeamId> => ({ ...bye, group }))
    );
  });
  return built;
}

function makeSchedule<TeamId>(
  legs: Legs,
  teams: readonly TeamId[],
  rng: Rng
): RoundRobinSchedule<TeamId> {
  return legs === Legs.TWO_WAY
    ? generateRoundRobin(teams, rng)
    : generateSingleDuels(teams, rng);
}

/** True when each fixture of the phase has a result, found by id (US-07.3).
 * The "Start phase N" button needs it. */
export function isPhaseComplete(
  fixtures: readonly { id: string }[],
  results: readonly { fixtureId: string }[]
): boolean {
  const played = new Set(results.map((result) => result.fixtureId));
  return fixtures.every((fixture) => played.has(fixture.id));
}

/** True for a phase before the latest started phase (US-07.3): its results
 * can no longer change. Both numbers count from 1. */
export function isPhaseLocked(phase: number, latestStartedPhase: number): boolean {
  return phase < latestStartedPhase;
}

/** True while the phase has no result (US-02.1, US-02.5): "Shuffle groups"
 * and the moves follow it. */
export function canChangeDraw(results: readonly { fixtureId: string }[]): boolean {
  return results.length === 0;
}
