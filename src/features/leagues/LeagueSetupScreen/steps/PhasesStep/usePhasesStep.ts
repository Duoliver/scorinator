import { useMemo } from 'preact/hooks';
import { bracketRulesOf } from '@/engine/phases';
import {
  bestMSuggestion,
  bracketWarning,
  endsWithGroups,
  phaseChecks,
  phaseCountLines,
  phaseProblemText,
} from '@/features/leagues/LeagueSetupScreen/phaseChecks';
import {
  canAddPhase,
  canHaveThirdPlace,
  canMovePhase,
} from '@/features/leagues/LeagueSetupScreen/phasePlans';
import type { PhaseList } from '@/features/leagues/LeagueSetupScreen/types';
import type { PhaseCardView } from './PhaseCard';

/** The Phases step data, ready for the markup (Task 129, Task 177): one
 * view for each card, with its counts, its problems, and its suggestion. */
export function usePhasesStep(
  phaseList: PhaseList,
  teamCount: number,
  firstGroupSizes?: readonly number[]
): {
  cards: PhaseCardView[];
  addable: boolean;
  countsKnown: boolean;
  /** The problems that name no phase, for example "Add a phase." */
  otherProblems: string[];
  groupsLast: boolean;
} {
  const { plans } = phaseList;
  return useMemo(() => {
    const { counts, problems } = phaseChecks(plans, teamCount, firstGroupSizes);
    const textsOf = (phase: number): string[] =>
      problems
        .filter((problem) => 'phase' in problem && problem.phase === phase)
        .map((problem) => phaseProblemText(problem, plans));
    return {
      cards: plans.map((plan, index) => ({
        plan,
        index,
        isLast: index === plans.length - 1,
        canRemove: plans.length > 1,
        canMoveUp: canMovePhase(plans, index, -1),
        canMoveDown: canMovePhase(plans, index, 1),
        lines: phaseCountLines(plans, counts, index),
        problems: textsOf(index + 1),
        suggestion: bestMSuggestion(plans, counts, index),
        bracket:
          plan.format === 'bracket'
            ? {
                rules: bracketRulesOf(plan),
                thirdPlaceAllowed: canHaveThirdPlace(counts?.[index]?.teams),
                warning: counts?.[index] && bracketWarning(counts[index].teams),
              }
            : undefined,
      })),
      addable: canAddPhase(plans),
      countsKnown: counts !== undefined,
      otherProblems: problems
        .filter((problem) => !('phase' in problem))
        .map((problem) => phaseProblemText(problem, plans)),
      groupsLast: endsWithGroups(plans),
    };
  }, [plans, teamCount, firstGroupSizes]);
}
