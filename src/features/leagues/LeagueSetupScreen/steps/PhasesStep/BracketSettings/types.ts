import type { PhaseCardView } from '@/features/leagues/LeagueSetupScreen/steps/PhasesStep/PhaseCard/types';
import type { PhaseList } from '@/features/leagues/LeagueSetupScreen/types';

export default interface BracketSettingsProps {
  /** The place of the Bracket phase in the list, from 0. */
  index: number;
  bracket: NonNullable<PhaseCardView['bracket']>;
  phaseList: PhaseList;
}
