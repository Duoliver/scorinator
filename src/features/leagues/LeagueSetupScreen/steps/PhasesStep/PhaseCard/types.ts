import type { PhaseFieldRanges } from '@/features/leagues/LeagueSetupScreen/phaseChecks';
import type { BracketPlanRules } from '@/engine/bracket';
import type { PhasePlan } from '@/engine/phases';
import type { PhaseList } from '@/features/leagues/LeagueSetupScreen/types';

/** What one card shows (Task 129, Task 177). */
export interface PhaseCardView {
  plan: PhasePlan;
  /** The place of the phase in the list, from 0. */
  index: number;
  isLast: boolean;
  canRemove: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  /** The group sizes and the qualifiers, when the numbers are known. */
  lines: { sizes?: string; qualifiers?: string };
  /** The texts of the problems of this phase. */
  problems: string[];
  /** The best M suggestion before a bracket (US-01.6). */
  suggestion?: { m: number; text: string };
  /** The settings of a Bracket phase (Task 140): the rules, or the
   * defaults, whether a third-place tie can exist, and the US-04.9
   * power-of-2 warning. */
  bracket?: { rules: BracketPlanRules; thirdPlaceAllowed: boolean; warning?: string };
  /** The lowest and highest values of the number fields (Task 191). */
  ranges: PhaseFieldRanges;
}

export default interface PhaseCardProps {
  view: PhaseCardView;
  phaseList: PhaseList;
}
