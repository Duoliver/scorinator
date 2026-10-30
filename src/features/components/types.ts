import type { ConfirmDialogProps } from '@/design-system';
import type { TeamImportPreview } from '@/app/loadActions';

/** What a view shows for one team: the name and colour of its league
 * Instance. See `useTeamLookup`. */
export interface TeamDisplay {
  name: string;
  colour: string;
}

/** What `useTeamImport` gives a screen with a team import button. */
export interface TeamImport {
  /** Reads a team file with one `readTeamsFrom*` action, then opens the
   * confirm. A cancel, a read error, or a file with no team opens nothing. */
  startImport: (read: () => Promise<TeamImportPreview | null>) => Promise<void>;
  /** The confirm to mount while a read file waits for the user, else
   * `null`. */
  importConfirm: ConfirmDialogProps | null;
}
