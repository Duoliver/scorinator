import type { PointsConfig } from '@/engine/standings';
import type { TeamBlueprint } from '@/domain';

export default interface ReviewStepProps {
  name: string;
  homeAdvantage: boolean;
  points: PointsConfig;
  selectedTeams: readonly TeamBlueprint[];
  onBack: () => void;
  onCreate: () => void;
}
