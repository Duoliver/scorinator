import type { PointsConfig } from '@/engine/standings';
import type { TeamInstance } from '@/domain';

export default interface ReviewStepProps {
  name: string;
  homeAdvantage: boolean;
  points: PointsConfig;
  /** The team list of the Teams step. */
  teams: readonly TeamInstance[];
  /** Why the list cannot start a league, or `null`. It disables "Create
   * league" (US-08.8). */
  createProblem: string | null;
  onBack: () => void;
  onCreate: () => void;
}
