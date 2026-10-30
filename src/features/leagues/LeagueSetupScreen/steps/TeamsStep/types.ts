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
  /** The trigrams fixed in the Edit drawer, by Blueprint UUID (Task 172). */
  fixedTrigrams: Readonly<Record<string, string>>;
  /** Adds an Instance, with a rolled OVR, for each Blueprint (Task 81). */
  onAddTeams: (blueprints: readonly TeamBlueprint[]) => void;
  onRemoveTeam: (blueprintUuid: string) => void;
  /** Puts a new Instance of `replacement` in the place of the team. */
  onSwitchTeam: (blueprintUuid: string, replacement: TeamBlueprint) => void;
  onBack: () => void;
  onNext: () => void;
}

/** Which part of the step is open: nothing, the add dialog, the team drawer
 * from the empty state, the team drawer over the add dialog, the Switch
 * dialog, or the team drawer over the Switch dialog. */
export type TeamsStepOverlay =
  'none' | 'picker' | 'firstTeam' | 'pickerTeam' | 'switch' | 'switchTeam';

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
  /** A reason the list cannot start a league, as a warning (US-08.6). */
  warning: string | null;
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
  /** The team row in the slot of the Switch dialog. */
  switchCurrent: PickerItem | undefined;
  closeSwitch: () => void;
  pickSwitch: (blueprintUuid: string) => void;
  openSwitchTeam: () => void;
  closeTeamDrawer: () => void;
  handleTeamCreated: (record: TeamFields) => void;
  loadAll: () => void;
  importSlugList: () => Promise<void>;
}
