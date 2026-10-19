import type { TableColumn } from '@/design-system';
import type { TeamRecord } from '@/domain';

/** Which drawer is open: none, a new team, or the team at `index`. */
export type TeamDrawerState =
  { mode: 'create' } | { mode: 'edit'; index: number } | null;

/** One roster row. Two teams can share a slug, so the key and the edit
 * target use the row's index in the roster, not the slug. */
export interface TeamRow extends TeamRecord {
  rowKey: string;
  index: number;
}

/** What `useTeams` gives `TeamsScreen`. */
export interface Teams {
  rows: TeamRow[];
  columns: TableColumn<TeamRow>[];
  countText: string;
  drawer: TeamDrawerState;
  /** The team the edit drawer starts from, or `undefined` for a new team. */
  editedTeam: TeamRecord | undefined;
  openCreateDrawer: () => void;
  closeDrawer: () => void;
  handleSave: (record: TeamRecord) => void;
  handleImport: () => Promise<void>;
}
