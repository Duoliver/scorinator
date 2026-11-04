import type { PhasePlan } from '@/engine/phases';
import type { PointsConfig } from '@/engine/standings';
import type { TeamInstance } from '@/domain';

export default interface ReviewStepProps {
  name: string;
  homeAdvantage: boolean;
  points: PointsConfig;
  /** The team list of the Teams step. */
  teams: readonly TeamInstance[];
  /** The phase chain of the Phases step (Task 129). */
  plans: readonly PhasePlan[];
  /** The team count of the bracket phase, when known: below 4 there is
   * no third-place tie (Task 140). */
  bracketQualifiers?: number;
  /** The texts of the phase problems (Task 177): the Review step lists
   * them all. */
  phaseProblems: readonly string[];
  /** Why the list cannot start a league, or `null`. It disables "Create
   * league" (US-08.8). */
  createProblem: string | null;
  onBack: () => void;
  onCreate: () => void;
}
