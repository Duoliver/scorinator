import type { PhasePlan } from '@/engine/phases';
import type { PhaseList } from '@/features/leagues/LeagueSetupScreen/types';

export default interface PhaseCardProps {
  plan: PhasePlan;
  /** The place of the phase in the list, from 0. */
  index: number;
  isLast: boolean;
  canRemove: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  phaseList: PhaseList;
}
