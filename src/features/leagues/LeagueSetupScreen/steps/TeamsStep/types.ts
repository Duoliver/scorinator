import type { PickerItem, TableColumn } from '@/design-system';
import type { TeamBlueprint, TeamFields, TeamInstance } from '@/domain';
import type { PointsConfig } from '@/engine/standings';

export default interface TeamsStepProps {
  /** The Details step values, shown as a quiet summary at the top (Task 33). */
  name: string;
  homeAdvantage: boolean;
  points: PointsConfig;
  /** The team list: one Instance for each team of the new league. */
  teams: readonly TeamInstance[];
  /** Adds an Instance, with a rolled OVR, for each Blueprint (Task 81). */
  onAddTeams: (blueprints: readonly TeamBlueprint[]) => void;
  onRemoveTeam: (blueprintUuid: string) => void;
  onBack: () => void;
  onNext: () => void;
}

/** Which part of the step is open: nothing, the add dialog, the team drawer
 * from the empty state, or the team drawer over the add dialog. */
export type TeamsStepOverlay = 'none' | 'picker' | 'firstTeam' | 'pickerTeam';

/** What `useTeamsStep` gives `TeamsStep`. */
export interface TeamsStepState {
  leagueName: string;
  chipLabels: string[];
  /** No Blueprint at all: the "first team" empty state (US-08.3). */
  hasNoBlueprints: boolean;
  columns: TableColumn<TeamInstance>[];
  countText: string;
  canLoadAll: boolean;
  canGoNext: boolean;
  /** The slugs that the last slug list import did not find, or `null`. */
  notFound: string[] | null;
  closeNotFound: () => void;
  overlay: TeamsStepOverlay;
  pickerItems: PickerItem[];
  pickerSelected: string[];
  setPickerSelected: (uuids: string[]) => void;
  pickerConfirmLabel: string;
  /** The slugs of every Blueprint, for the `-2` slug preview (Task 75). */
  takenSlugs: string[];
  openPicker: () => void;
  closePicker: () => void;
  confirmPicker: () => void;
  openFirstTeam: () => void;
  openPickerTeam: () => void;
  closeTeamDrawer: () => void;
  handleTeamCreated: (record: TeamFields) => void;
  loadAll: () => void;
  importSlugList: () => Promise<void>;
}
