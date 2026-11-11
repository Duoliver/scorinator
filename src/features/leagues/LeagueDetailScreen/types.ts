import type { ComponentChildren, RefObject } from 'preact';
import type { DropdownMenuItem, FieldHandle, TabItem } from '@/design-system';
import type { PlanZone, ZonePlan } from '@/engine/phases';
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
  /** The end of the top tab row: "Edit zones" of a one-phase league (Task
   * 189). A league with phase tabs has it in each phase tab instead. */
  tabsActions: ComponentChildren;
  /** Opens a tab from outside `Tabs`: the new phase after a start. */
  tabsRef: RefObject<FieldHandle<string>>;
  /** The items of the export menu (US-10.1). */
  exportItems: DropdownMenuItem[];
  /** The confirm of a phase start while it is open (US-07.3). */
  startConfirm: PhaseStartConfirm | undefined;
  /** The "Edit zones" drawer while it is open (Task 189). */
  zoneDrawer: ZoneDrawerView | undefined;
}

/** The "Edit zones" drawer of one phase (Task 189 choice 6). */
export interface ZoneDrawerView {
  title: string;
  plan: ZonePlan;
  onSave: (zones: PlanZone[]) => void;
  onCancel: () => void;
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
