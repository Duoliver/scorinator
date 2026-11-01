import { groupCountFor, groupSizes } from '@/engine/round-robin';
import type { PhaseChainProblem, PhaseFitProblem, PhasePlan } from './types';

/**
 * Checks the order of the phases (US-01.3): a bracket only as the last
 * phase, an advancement on each phase before the last, and none on the
 * last. A one-phase bracket league is valid. Gives an empty list for a
 * valid chain. The screen and the import write the text (Task 126 choice
 * 3).
 */
export function checkPhaseChain(plans: readonly PhasePlan[]): PhaseChainProblem[] {
  if (plans.length === 0) return [{ code: 'no-phases' }];
  const problems: PhaseChainProblem[] = [];
  plans.forEach((plan, index) => {
    const phase = index + 1;
    const isLast = phase === plans.length;
    if (plan.format === 'bracket') {
      if (!isLast) problems.push({ code: 'bracket-not-last', phase });
      return;
    }
    if (!isLast && !plan.advance) problems.push({ code: 'missing-advancement', phase });
    if (isLast && plan.advance) problems.push({ code: 'advancement-on-last', phase });
  });
  return problems;
}

/**
 * The qualifier count of a phase (US-01.4, US-01.6): `top` for a round
 * robin, groups × `top` + M for Groups.
 *
 * Throws a `RangeError` for a plan with no advancement: a bracket, or the
 * last phase.
 */
export function qualifierCount(plan: PhasePlan, groupCount: number): number {
  if (plan.format === 'bracket' || !plan.advance) {
    throw new RangeError('qualifierCount needs a phase with an advancement.');
  }
  if (plan.format === 'round-robin') return plan.advance.top;
  return groupCount * plan.advance.top + plan.advance.bestOfNext;
}

/**
 * The best M to suggest when the next phase is a bracket (US-01.6): the
 * smallest M that makes groups × top + M a power of 2, inside the fit range
 * (M up to the group count minus 1, and place top + 1 in the smallest
 * group). Gives `undefined` when the count is already a power of 2, or when
 * no M fits. 6 groups × top 2 = 12 gives 4.
 */
export function suggestBestM(
  groupCount: number,
  top: number,
  smallestGroupSize: number
): number | undefined {
  const base = groupCount * top;
  if (isPowerOfTwo(base) || top + 1 > smallestGroupSize) return undefined;
  for (let m = 1; m <= groupCount - 1; m++) {
    if (isPowerOfTwo(base + m)) return m;
  }
  return undefined;
}

/** The team count of one phase, and the group sizes of a Groups phase
 * with a valid group setting (Task 177). */
export interface PhaseTeamCount {
  teams: number;
  groupSizes?: number[];
}

/**
 * The team count of each phase, from the team count of phase 1 (Task 177):
 * each later phase gets the qualifier count of the phase before it
 * (`qualifierCount`). A Groups phase also gets its group sizes.
 *
 * `firstGroupSizes` are the real sizes of a phase-1 draw, because manual
 * moves can make them uneven (Task 126 choice 4). Without them, and for a
 * later phase, the sizes come from `groupSizes`.
 *
 * The list stops after a phase with fewer than 2 teams, a bracket, no
 * advancement, a group setting that is not valid, or a next count that is
 * not a whole number (a Top that is not a number). The wizard shows these
 * counts, and `checkPhaseFit` checks them, so the two never differ.
 */
export function phaseTeamCounts(
  plans: readonly PhasePlan[],
  teamCount: number,
  firstGroupSizes?: readonly number[]
): PhaseTeamCount[] {
  const counts: PhaseTeamCount[] = [];
  let teams = teamCount;

  for (const [index, plan] of plans.entries()) {
    let groupCount = 1;
    if (plan.format === 'groups') {
      const sizes =
        teams >= 2
          ? groupSizesOf(plan, teams, index === 0 ? firstGroupSizes : undefined)
          : undefined;
      counts.push(sizes ? { teams, groupSizes: sizes } : { teams });
      if (!sizes) return counts;
      groupCount = sizes.length;
    } else {
      counts.push({ teams });
    }
    if (teams < 2 || plan.format === 'bracket' || !plan.advance) return counts;
    const next = qualifierCount(plan, groupCount);
    if (!Number.isInteger(next)) return counts;
    teams = next;
  }

  return counts;
}

/**
 * Checks the team counts of each phase (US-01.4, US-01.6, US-02.1), from
 * `phaseTeamCounts`. Gives an empty list when every count fits. One group
 * in size mode is not a problem (Task 126 choice 5).
 *
 * The check stops where `phaseTeamCounts` stops. A missing advancement is a
 * `checkPhaseChain` problem.
 */
export function checkPhaseFit(
  plans: readonly PhasePlan[],
  teamCount: number,
  firstGroupSizes?: readonly number[]
): PhaseFitProblem[] {
  const problems: PhaseFitProblem[] = [];

  for (const [index, { teams, groupSizes: sizes }] of phaseTeamCounts(
    plans,
    teamCount,
    firstGroupSizes
  ).entries()) {
    const phase = index + 1;
    const plan = plans[index];
    if (teams < 2) {
      problems.push({ code: 'too-few-teams', phase, teams });
      break;
    }
    if (plan.format === 'bracket') break;

    if (plan.format === 'round-robin') {
      const top = plan.advance?.top;
      if (top !== undefined && !isWholeInRange(top, 1, teams - 1)) {
        problems.push({ code: 'top-out-of-range', phase, top, max: teams - 1 });
      }
      continue;
    }

    if (!sizes) {
      problems.push({ code: 'grouping-out-of-range', phase });
      break;
    }
    sizes.forEach((size, i) => {
      if (size < 2)
        problems.push({ code: 'group-too-small', phase, group: i + 1, teams: size });
    });
    if (!plan.advance) break;

    const smallest = Math.min(...sizes);
    const { top, bestOfNext } = plan.advance;
    if (!isWholeInRange(top, 1, smallest - 1)) {
      problems.push({ code: 'top-out-of-range', phase, top, max: smallest - 1 });
    }
    if (!isWholeInRange(bestOfNext, 0, sizes.length - 1)) {
      problems.push({
        code: 'best-m-out-of-range',
        phase,
        bestOfNext,
        max: sizes.length - 1,
      });
    }
    if (bestOfNext > 0 && top + 1 > smallest) {
      problems.push({ code: 'best-m-place-missing', phase, place: top + 1 });
    }
  }

  return problems;
}

// The group sizes of a Groups phase, or `undefined` when its group setting
// is not valid.
function groupSizesOf(
  plan: Extract<PhasePlan, { format: 'groups' }>,
  teams: number,
  realSizes: readonly number[] | undefined
): number[] | undefined {
  if (realSizes) return [...realSizes];
  const setting = plan.grouping;
  const value = setting.by === 'size' ? setting.size : setting.count;
  if (!isWholeInRange(value, 2, Infinity)) return undefined;
  return groupSizes(teams, groupCountFor(teams, setting));
}

function isWholeInRange(value: number, min: number, max: number): boolean {
  return Number.isInteger(value) && value >= min && value <= max;
}

function isPowerOfTwo(n: number): boolean {
  return Number.isInteger(n) && n >= 1 && (n & (n - 1)) === 0;
}
