import type { TableColumn } from '@/design-system';
import type { TeamRecord } from '@/domain';
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

/** What `useTeamsStep` gives `TeamsStep`. */
export interface TeamsStepState {
  leagueName: string;
  chipLabels: string[];
  handleSearchChange: (query: string) => void;
  rows: TeamRecord[];
  columns: TableColumn<TeamRecord>[];
  selectedCountText: string;
  /** True when every team that the search shows is selected. The one
   * selection button then clears them, or else it selects them all. */
  allVisibleSelected: boolean;
  hasVisibleTeams: boolean;
  handleSelectionButton: () => void;
  canGoNext: boolean;
  showCreateTeam: boolean;
  openCreateTeam: () => void;
  closeCreateTeam: () => void;
  handleTeamCreated: (record: TeamRecord) => void;
}
