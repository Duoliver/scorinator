import type { PointsConfig } from '@/engine/standings';
import type { TeamRecord } from '@/features/components';

export default interface ReviewStepProps {
  name: string;
  homeAdvantage: boolean;
  points: PointsConfig;
  selectedTeams: readonly TeamRecord[];
  onBack: () => void;
  onCreate: () => void;
}
