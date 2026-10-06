import type { PointsConfig } from '@/engine/standings';

export default interface TeamsStepProps {
  /** The Details step values, shown as a quiet summary at the top (Task 33). */
  name: string;
  homeAdvantage: boolean;
  points: PointsConfig;
  selectedSlugs: readonly string[];
  onToggleTeam: (slug: string) => void;
  onSelectAll: (slugs: string[]) => void;
  onClearSelection: (slugs: string[]) => void;
  onTeamCreated: (slug: string) => void;
  onBack: () => void;
  onNext: () => void;
}
