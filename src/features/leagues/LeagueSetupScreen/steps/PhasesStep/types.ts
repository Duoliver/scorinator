import type { PhaseList } from '@/features/leagues/LeagueSetupScreen/types';

export default interface PhasesStepProps {
  phaseList: PhaseList;
  /** The team list size: the counts and the fit check need it (Task 177). */
  teamCount: number;
  /** The sizes of the phase-1 draw, with its moves (Task 130). */
  firstGroupSizes?: readonly number[];
  onBack: () => void;
  onNext: () => void;
}
