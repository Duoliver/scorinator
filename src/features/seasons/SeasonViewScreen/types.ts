import type { ConfirmDialogProps, MultiPickerProps } from '@/design-system';
import type { RosterRow } from './TeamsTab';
import type { PlayoffDialogProps } from './PlayoffDialog';
import type { PlayoffRow } from './PlayoffsTab';
import type { ResumeCard } from './ResumeTab';
import type { LeagueCard, SeasonTeamDrawerProps } from '@/features/components';

export default interface SeasonViewScreenProps {
  uuid: string;
}

/** The Season view once its Season is open. */
export interface OpenSeasonView {
  name: string;
  year: string;
  meta: string;
  isFinished: boolean;
  isUnsaved: boolean;
  /** One card for each league, in Season order, as the leagues dashboard
   * shows a league (Task 219 choices 6 and 7). */
  leagueCards: LeagueCard[];
  /** The wizard of a new league in this Season (Task 218). */
  newLeaguePath: string;
  rosterRows: readonly RosterRow[];
  toggleFinished: () => void;
  finishConfirm: ConfirmDialogProps | null;
  openPicker: () => void;
  picker: MultiPickerProps | null;
  openDrawer: (blueprintUuid: string) => void;
  drawer: SeasonTeamDrawerProps | null;
  /** The playoffs, in the order of creation (Task 220 choice 8). */
  playoffRows: PlayoffRow[];
  hasAetKey: boolean;
  openPlayoffDialog: () => void;
  playoffDialog: PlayoffDialogProps | null;
  /** The cards of the Resume tab, in Season order (Task 221). */
  resumeCards: ResumeCard[];
  /** The open tab: its action shows on the tab row (Task 220 choice 1). */
  activeTab: SeasonTab;
  setActiveTab: (tab: SeasonTab) => void;
}

/** The tabs of the Season view. */
export type SeasonTab = 'teams' | 'playoffs' | 'resume';

/** What `useSeasonView` gives the screen: the Season, or why it does not
 * show (as League Detail does). */
export type SeasonViewState =
  | { kind: 'opening' }
  | { kind: 'not-found' }
  | { kind: 'error'; message: string }
  | { kind: 'open'; view: OpenSeasonView };
