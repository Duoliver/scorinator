import type { PointsConfig } from '@/engine/standings';
import type { TeamInstance } from '@/domain';

export default interface ReviewStepProps {
  name: string;
  homeAdvantage: boolean;
  points: PointsConfig;
  /** The team list of the Teams step. */
  teams: readonly TeamInstance[];
  onBack: () => void;
  onCreate: () => void;
}
