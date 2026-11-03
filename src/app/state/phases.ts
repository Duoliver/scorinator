import { fixedLot } from '@/engine/identity';
import { canChangeDraw, isPhaseComplete, pickQualifiers } from '@/engine/phases';
import { calculateStandings, type LotOf, type StandingsRow } from '@/engine/standings';
import type { LeagueWrapper } from '@/domain';

/** The fixed lot of each team in this league (Task 78 rule 1, Task 124):
 * a hash of the league UUID and the team's Blueprint UUID. */
export function leagueLotOf(wrapper: LeagueWrapper): LotOf<string> {
  const leagueUuid = wrapper.content.uuid;
  return (team) => fixedLot(leagueUuid, team);
}

/** The team lists of one started phase: one list for each group, or one
 * list for a round robin. Phase 1 of a round robin has every league team, in
 * the team list order. A later round robin takes its teams in the order of
 * their first fixture or bye (Task 128 choice 3): the lots decide a tie, so
 * this order matters only for two equal lots. */
function phaseTeamLists(wrapper: LeagueWrapper, phaseIndex: number): string[][] {
  const phase = wrapper.content.phases[phaseIndex];
  if (!phase) {
    throw new RangeError(`The league has no started phase ${phaseIndex + 1}.`);
  }
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
 * in group order, or one table for a round robin. Each table counts only the
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
  const { results } = phases[phaseIndex] ?? { results: [] };
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
  if (!current || phases.length >= plans.length) return false;
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

/** How a row of a phase table qualifies (US-02.2, US-07.2): a qualifier
 * place, or a place N + 1 that can still send its best M. */
export type QualifierMark = 'qualifier' | 'best-of-next';

/**
 * The qualifier marks of one started phase, by Blueprint UUID (Task 132).
 * The last phase, and a phase with no advancement, mark nothing.
 *
 * - During the phase, the marks follow the current order: the top N rows of
 *   the table or of each group, and each place N + 1 row of a best M.
 * - A complete phase marks the teams that `startNextPhase` sends on
 *   (`pickQualifiers`), so the best M of place N + 1 become qualifiers and
 *   the other place N + 1 rows lose their mark. A locked phase is complete,
 *   so it keeps these marks.
 */
export function phaseQualifierMarks(
  wrapper: LeagueWrapper,
  phaseIndex: number
): Map<string, QualifierMark> {
  const marks = new Map<string, QualifierMark>();
  const plan = wrapper.content.plans[phaseIndex];
  const phase = wrapper.content.phases[phaseIndex];
  if (!plan || !phase || plan.format === 'bracket' || !plan.advance) return marks;

  const tables = phaseStandings(wrapper, phaseIndex);
  if (isPhaseComplete(phase.fixtures, phase.results)) {
    for (const team of pickQualifiers(plan, tables, leagueLotOf(wrapper))) {
      marks.set(team, 'qualifier');
    }
    return marks;
  }

  const { top } = plan.advance;
  const bestOfNext = plan.format === 'groups' ? plan.advance.bestOfNext : 0;
  for (const table of tables) {
    table.slice(0, top).forEach((row) => marks.set(row.team, 'qualifier'));
    const next = table[top];
    if (bestOfNext > 0 && next) marks.set(next.team, 'best-of-next');
  }
  return marks;
}
