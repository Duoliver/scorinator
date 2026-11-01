import type { GroupsPlan, PhasePlan } from '@/engine/phases';
import type { Rng } from '@/engine/rng';
import {
  addToSmallestGroup,
  drawGroups,
  groupCountFor,
  removeFromGroups,
  resizeGroups,
  switchInGroups,
} from '@/engine/round-robin';
import { phaseShortName } from '@/features/leagues/leagueSummary';

/**
 * The phase-1 draw of the wizard (Task 130, US-02.1): pure changes of the
 * group lists of Blueprint UUIDs, after a team action or a plan change.
 * The engine gives each step (Task 125). In size mode, a team count change
 * can change the group count: the draw then resizes first (Task 125
 * choice 3), and the rest of the draw stays.
 */

type Groups = readonly (readonly string[])[];

/** The group count of the plan for `teamCount` teams, or `fallback` for a
 * group setting that is not valid (a field that is not a number). */
function groupCount(plan: GroupsPlan, teamCount: number, fallback: number): number {
  try {
    return groupCountFor(teamCount, plan.grouping);
  } catch {
    return fallback;
  }
}

/** The draw after a phase-1 plan change: none when phase 1 is not Groups,
 * a new draw of `teams` when there was none, or a resize to the new count.
 * A group setting that is not valid keeps the draw. */
export function groupsForPlan(
  groups: Groups | null,
  plan: PhasePlan | undefined,
  teams: readonly string[],
  rng: Rng
): string[][] | null {
  if (plan?.format !== 'groups') return null;
  if (!groups) {
    const count = groupCount(plan, teams.length, Number.NaN);
    return Number.isNaN(count) ? [] : drawGroups(teams, count, rng);
  }
  const count = groupCount(plan, teams.length, groups.length);
  return resizeGroups(groups, count, rng);
}

/** The draw after an add: each team in turn goes into the smallest group,
 * after a resize when the count grows. */
export function groupsAfterAdd(
  groups: Groups,
  plan: GroupsPlan,
  added: readonly string[],
  rng: Rng
): string[][] {
  let next = groups.map((group) => [...group]);
  for (const team of added) {
    const count = groupCount(plan, next.flat().length + 1, Math.max(next.length, 1));
    next = addToSmallestGroup(resizeGroups(next, count, rng), team);
  }
  return next;
}

/** The draw after a remove: the team leaves its group, then the draw
 * resizes to the new count. */
export function groupsAfterRemove(
  groups: Groups,
  plan: GroupsPlan,
  team: string,
  rng: Rng
): string[][] {
  const next = removeFromGroups(groups, team);
  return resizeGroups(next, groupCount(plan, next.flat().length, next.length), rng);
}

/** The draw after a Switch: the new team takes the place of the old one. */
export function groupsAfterSwitch(
  groups: Groups,
  oldTeam: string,
  newTeam: string
): string[][] {
  return switchInGroups(groups, oldTeam, newTeam);
}

/** The line under the phase-1 group cards (Task 130 choice 5), or
 * `undefined` when phase 1 is not Groups or is the last phase. */
export function groupsAdvanceText(plans: readonly PhasePlan[]): string | undefined {
  const [first, next] = plans;
  if (first?.format !== 'groups' || !first.advance || !next) return undefined;
  const { top, bestOfNext } = first.advance;
  const best = bestOfNext > 0 ? ` and the best ${bestOfNext} of place ${top + 1}` : '';
  return `Top ${top} of each group${best} advance to the ${phaseShortName(next)}.`;
}
