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
}

export default interface PhaseCardProps {
  view: PhaseCardView;
  phaseList: PhaseList;
}
