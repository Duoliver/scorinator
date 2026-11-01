import type { PhaseList } from '@/features/leagues/LeagueSetupScreen/types';

export default interface PhasesStepProps {
  phaseList: PhaseList;
  /** The team list size: the counts and the fit check need it (Task 177). */
  teamCount: number;
  onBack: () => void;
  onNext: () => void;
}
