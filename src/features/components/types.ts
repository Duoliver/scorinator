import type { ConfirmDialogProps } from '@/design-system';
import type { PendingFileImport } from '@/app/importFileActions';
import type { TeamImportPreview } from '@/app/loadActions';
import type { FileImportDialogsProps } from './FileImportDialogs';

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

/** What `useFileImport` gives a screen with a league, team, or database
 * import button. */
export interface FileImport {
  /** Reads a file with one `plan*FileImport` action, then opens the dialogs
   * it needs. A cancel or a read error opens nothing. */
  startFileImport: (read: () => Promise<PendingFileImport | null>) => Promise<void>;
  /** The props of `FileImportDialogs` while the import waits for the user,
   * else `null`. */
  importDialogs: FileImportDialogsProps | null;
}
