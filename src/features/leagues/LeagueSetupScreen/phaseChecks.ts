import {
  checkPhaseChain,
  checkPhaseFit,
  phaseTeamCounts,
  suggestBestM,
  type PhaseChainProblem,
  type PhaseFitProblem,
  type PhasePlan,
  type PhaseTeamCount,
} from '@/engine/phases';
import { groupLabel } from '@/engine/round-robin';

/**
 * The counts, the suggestion, and the problem texts of the wizard Phases
 * and Review steps (Task 177). Pure functions of the plans and the team
 * count.
 */

export type PhaseProblem = PhaseChainProblem | PhaseFitProblem;

/** The US-01.5 warning when the last phase is Groups. It blocks nothing. */
export const GROUPS_LAST_WARNING =
  'This league ends with groups. Each group winner is a champion. There is no single league winner.';

/** The US-01.2 note on the Phases step (Task 177 choice 5). */
export const HOME_ADVANTAGE_NOTE =
  "The league's home advantage applies to round-robin and group phases, and to two-legged ties only.";

/** The Phases step note before the team list has 2 teams (choice 3). */
export const COUNTS_LATER_NOTE = 'The counts show when the league has 2 teams.';

/** The fit check needs a team count: before 2 teams, only the chain
 * problems and no counts (choice 3). `firstGroupSizes` are the sizes of the
 * phase-1 draw of the Teams step, with its moves (Task 130). */
export function phaseChecks(
  plans: readonly PhasePlan[],
  teamCount: number,
  firstGroupSizes?: readonly number[]
): { counts: PhaseTeamCount[] | undefined; problems: PhaseProblem[] } {
  const chain = checkPhaseChain(plans);
  if (teamCount < 2) return { counts: undefined, problems: chain };
  return {
    counts: phaseTeamCounts(plans, teamCount, firstGroupSizes),
    problems: [...chain, ...checkPhaseFit(plans, teamCount, firstGroupSizes)],
  };
}

const teamsText = (count: number): string => `${count} team${count === 1 ? '' : 's'}`;

/** The user text of one problem (Task 177 choice 2). */
export function phaseProblemText(
  problem: PhaseProblem,
  plans: readonly PhasePlan[]
): string {
  switch (problem.code) {
    case 'no-phases':
      return 'Add a phase.';
    case 'bracket-not-last':
      return `Phase ${problem.phase} is a bracket. A bracket must be the last phase.`;
    case 'missing-advancement':
      return `Phase ${problem.phase} has no Top.`;
    case 'advancement-on-last':
      return `Phase ${problem.phase} is the last phase, but it has a Top.`;
    case 'too-few-teams':
      return `Phase ${problem.phase} gets ${teamsText(problem.teams)}. A phase needs at least 2 teams.`;
    case 'grouping-out-of-range': {
      const plan = plans[problem.phase - 1];
      const field =
        plan?.format === 'groups' && plan.grouping.by === 'count'
          ? 'group count'
          : 'group size';
      return `Phase ${problem.phase}: the ${field} must be a whole number of 2 or more.`;
    }
    case 'group-too-small':
      return `Phase ${problem.phase}: group ${groupLabel(problem.group - 1)} has ${teamsText(problem.teams)}. A group needs at least 2 teams.`;
    case 'top-out-of-range': {
      if (problem.max < 1) {
        const needs =
          plans[problem.phase - 1]?.format === 'groups'
            ? 'Each group needs more teams.'
            : 'The phase needs more teams.';
        return `No Top fits phase ${problem.phase}. ${needs}`;
      }
      return `Phase ${problem.phase}: Top must be a whole number from 1 to ${problem.max}.`;
    }
    case 'best-m-out-of-range': {
      const plan = plans[problem.phase - 1];
      const top = plan?.format === 'groups' ? plan.advance?.top : undefined;
      const place =
        top !== undefined && Number.isInteger(top)
          ? `place ${top + 1}`
          : 'the next place';
      return `Phase ${problem.phase}: Best of ${place} must be a whole number from 0 to ${problem.max}.`;
    }
    case 'best-m-place-missing':
      return `Phase ${problem.phase}: the smallest group has no place ${problem.place}.`;
  }
}

const groupsText = (count: number): string => `${count} group${count === 1 ? '' : 's'}`;

/** The count lines of one phase card (US-01.4, US-01.6, US-02.1): the group
 * sizes of a Groups phase, and the qualifiers of a phase that is not the
 * last. A line shows only when its numbers are known. */
export function phaseCountLines(
  plans: readonly PhasePlan[],
  counts: readonly PhaseTeamCount[] | undefined,
  index: number
): { sizes?: string; qualifiers?: string } {
  const count = counts?.[index];
  const next = counts?.[index + 1];
  const plan = plans[index];
  if (!count || !plan) return {};

  const lines: { sizes?: string; qualifiers?: string } = {};
  const sizes = count.groupSizes;
  if (sizes) lines.sizes = `${groupsText(sizes.length)}: ${sizes.join(', ')}`;
  if (!next || plan.format === 'bracket' || !plan.advance) return lines;

  const goTo = `= ${next.teams} teams go to phase ${index + 2}`;
  if (plan.format === 'round-robin') {
    lines.qualifiers = `Top ${plan.advance.top} ${goTo}`;
  } else if (sizes) {
    const { top, bestOfNext } = plan.advance;
    const best = bestOfNext > 0 ? ` + best ${bestOfNext} of place ${top + 1}` : '';
    lines.qualifiers = `${groupsText(sizes.length)} × top ${top}${best} ${goTo}`;
  }
  return lines;
}

/** The best M suggestion of a Groups card when the next phase is a bracket
 * (US-01.6): the M, and the text. `undefined` when no M fits, when the
 * count is already a power of 2, or when the plan already has that M. */
export function bestMSuggestion(
  plans: readonly PhasePlan[],
  counts: readonly PhaseTeamCount[] | undefined,
  index: number
): { m: number; text: string } | undefined {
  const plan = plans[index];
  const sizes = counts?.[index]?.groupSizes;
  if (
    plan?.format !== 'groups' ||
    !plan.advance ||
    !sizes ||
    plans[index + 1]?.format !== 'bracket'
  ) {
    return undefined;
  }
  const { top, bestOfNext } = plan.advance;
  const m = suggestBestM(sizes.length, top, Math.min(...sizes));
  if (m === undefined || m === bestOfNext) return undefined;
  const base = sizes.length * top;
  return {
    m,
    text: `${groupsText(sizes.length)} × top ${top} = ${base}. Best ${m} of place ${top + 1} give ${base + m}.`,
  };
}

/** True when the last phase is Groups (US-01.5). */
export function endsWithGroups(plans: readonly PhasePlan[]): boolean {
  return plans[plans.length - 1]?.format === 'groups';
}
