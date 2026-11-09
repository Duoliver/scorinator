import type { RefObject } from 'preact';
import type { DropdownMenuItem, FieldHandle, TabItem } from '@/design-system';
import type { LeagueWrapper } from '@/domain';

export default interface LeagueDetailScreenProps {
  uuid: string;
}

/** What `useLeagueDetail` gives `LeagueDetailScreen` for an open league. */
export interface LeagueDetail {
  league: LeagueWrapper;
  meta: string;
  /** The header badge: "Group Stage · MD 6/6", or "Complete" (Task 131). */
  progress: string;
  isComplete: boolean;
  isUnsaved: boolean;
  /** One tab for each phase, or Standings and Fixtures for a one-phase
   * league (Task 131 choice 2). */
  tabs: TabItem[];
  defaultTab: string;
  /** Opens a tab from outside `Tabs`: the new phase after a start. */
  tabsRef: RefObject<FieldHandle<string>>;
  /** The items of the export menu (US-10.1). */
  exportItems: DropdownMenuItem[];
  /** The confirm of a phase start while it is open (US-07.3). */
  startConfirm: PhaseStartConfirm | undefined;
}

/** The texts and handlers of the phase start confirm (US-07.3). */
export interface PhaseStartConfirm {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Where the league of the route stands: read from the database, still
 * reading, not in the database, or in a file that cannot be read. */
export type LeagueDetailState =
  | { kind: 'open'; detail: LeagueDetail }
  | { kind: 'opening' }
  | { kind: 'not-found' }
  | { kind: 'error'; message: string };
