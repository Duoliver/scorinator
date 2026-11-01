import type { PhaseList } from '@/features/leagues/LeagueSetupScreen/types';

export default interface PhasesStepProps {
  phaseList: PhaseList;
  onBack: () => void;
  onNext: () => void;
}
