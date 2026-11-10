import { fixedLot } from '@/engine/identity';
import {
  canChangeDraw,
  getPhaseZones,
  getZoneColours,
  isPhaseComplete,
  pickQualifiers,
  type PhaseZone,
  type ZoneColour,
} from '@/engine/phases';
import { calculateStandings, type LotOf, type StandingsRow } from '@/engine/standings';
import type { LeagueWrapper } from '@/domain';

/** The fixed lot of each team in this league (Task 78 rule 1, Task 124):
 * a hash of the league UUID and the team's Blueprint UUID. */
export function leagueLotOf(wrapper: LeagueWrapper): LotOf<string> {
  const leagueUuid = wrapper.content.uuid;
  return (team) => fixedLot(leagueUuid, team);
}

/** The team lists of one started phase: one list for each group, one list
 * for a round robin, and none for a bracket, which has no table. Phase 1 of a round robin has every league team, in
 * the team list order. A later round robin takes its teams in the order of
 * their first fixture or bye (Task 128 choice 3): the lots decide a tie, so
 * this order matters only for two equal lots. */
export function phaseTeamLists(wrapper: LeagueWrapper, phaseIndex: number): string[][] {
  const phase = wrapper.content.phases[phaseIndex];
  if (!phase) {
    throw new RangeError(`The league has no started phase ${phaseIndex + 1}.`);
  }
  if (phase.format === 'bracket') return [];
  if (phase.format === 'groups') return phase.groups.map((group) => [...group]);
  if (phaseIndex === 0) return [wrapper.teams.map((team) => team.blueprintUuid)];
  const teams = new Set<string>();
  for (const fixture of phase.fixtures) {
    teams.add(fixture.home);
    teams.add(fixture.away);
  }
  for (const bye of phase.byes) teams.add(bye.team);
  return [[...teams]];
}

/**
 * The standings of one started phase (Task 128): one table for each group,
 * in group order, one table for a round robin, and none for a bracket. Each table counts only the
 * results of its own phase and group, so each phase starts from zero
 * (US-07.1). Level teams follow the fixed lots of the league (Task 124).
 *
 * Throws a `RangeError` for a phase that has not started.
 */
export function phaseStandings(
  wrapper: LeagueWrapper,
  phaseIndex: number
): StandingsRow<string>[][] {
  const { phases, points } = wrapper.content;
  const lotOf = leagueLotOf(wrapper);
  const phase = phases[phaseIndex];
  const results = phase && phase.format !== 'bracket' ? phase.results : [];
  return phaseTeamLists(wrapper, phaseIndex).map((teams) => {
    const members = new Set(teams);
    const own = results.filter(
      (result) => members.has(result.home) && members.has(result.away)
    );
    return calculateStandings(teams, own, points, lotOf);
  });
}

/** True when the current phase is complete and the league plans a next
 * phase (US-07.3). The "Start phase N" button needs it (Task 132). */
export function canStartNextPhase(wrapper: LeagueWrapper): boolean {
  const { phases, plans } = wrapper.content;
  const current = phases[phases.length - 1];
  // A bracket is always the last phase (US-01.3), so it has no next phase.
  if (!current || current.format === 'bracket' || phases.length >= plans.length) {
    return false;
  }
  return isPhaseComplete(current.fixtures, current.results);
}

/** True when the current phase is a Groups phase after phase 1 with no
 * result yet (US-02.1, US-02.5): Shuffle and moves can change its draw.
 * Phase 1 draws in the wizard. */
export function canChangeCurrentGroups(wrapper: LeagueWrapper): boolean {
  const { phases } = wrapper.content;
  const index = phases.length - 1;
  const current = phases[index];
  return index >= 1 && current?.format === 'groups' && canChangeDraw(current.results);
}

/** The zones of one phase, and the zone colour of each team by Blueprint
 * UUID (US-12.5). */
export interface PhaseZoneView {
  zones: PhaseZone[];
  colours: Map<string, ZoneColour>;
}

/**
 * The zones of one started phase, and the colour of each row (Task 155).
 * The zones replace the qualifier highlight of US-02.2 and US-07.2. A
 * bracket has no table, so it has no zone.
 *
 * - During the phase, the rows follow the current order.
 * - A complete phase gives `getZoneColours` the teams that
 *   `startNextPhase` sends on (`pickQualifiers`). So the best M of place
 *   N + 1 turn green, and the other place N + 1 rows lose the yellow. A
 *   locked phase is complete, so it keeps these colours.
 */
export function getPhaseZoneView(
  wrapper: LeagueWrapper,
  phaseIndex: number
): PhaseZoneView {
  const plan = wrapper.content.plans[phaseIndex];
  const phase = wrapper.content.phases[phaseIndex];
  if (!plan || !phase || plan.format === 'bracket' || phase.format === 'bracket') {
    return { zones: [], colours: new Map() };
  }
  const zones = getPhaseZones(plan);
  const tables = phaseStandings(wrapper, phaseIndex);
  const qualifiers =
    plan.advance && isPhaseComplete(phase.fixtures, phase.results)
      ? new Set(pickQualifiers(plan, tables, leagueLotOf(wrapper)))
      : undefined;
  const teams = tables.map((table) => table.map((row) => row.team));
  return { zones, colours: getZoneColours(zones, teams, qualifiers) };
}
