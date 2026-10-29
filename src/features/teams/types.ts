import type { TableColumn } from '@/design-system';
import type { TeamBlueprint, TeamFields } from '@/domain';

/** Which drawer is open: none, a new team, or the team at `index`. */
export type TeamDrawerState =
  { mode: 'create' } | { mode: 'edit'; index: number } | null;

/** One roster row. Two teams can share a slug, so the key and the edit
 * target use the row's index in the roster, not the slug. */
export interface TeamRow extends TeamBlueprint {
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
  editedTeam: TeamFields | undefined;
  openCreateDrawer: () => void;
  closeDrawer: () => void;
  handleSave: (record: TeamFields) => void;
  handleImport: () => Promise<void>;
}
