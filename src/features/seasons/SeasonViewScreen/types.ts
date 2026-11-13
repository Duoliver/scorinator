import type { ConfirmDialogProps, MultiPickerProps } from '@/design-system';
import type { RosterRow } from './TeamsTab';
import type { SeasonTeamDrawerProps } from './SeasonTeamDrawer';

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
  hasLeagues: boolean;
  rosterRows: readonly RosterRow[];
  toggleFinished: () => void;
  finishConfirm: ConfirmDialogProps | null;
  openPicker: () => void;
  picker: MultiPickerProps | null;
  openDrawer: (blueprintUuid: string) => void;
  drawer: SeasonTeamDrawerProps | null;
}

/** What `useSeasonView` gives the screen: the Season, or why it does not
 * show (as League Detail does). */
export type SeasonViewState =
  | { kind: 'opening' }
  | { kind: 'not-found' }
  | { kind: 'error'; message: string }
  | { kind: 'open'; view: OpenSeasonView };
