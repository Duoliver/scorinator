import type { ConfirmDialogProps } from '@/design-system';
import type { PendingFileImport } from '@/app/importFileActions';
import type { TeamImportPreview } from '@/app/loadActions';
import type { FileImportDialogsProps } from './FileImportDialogs';

/** What a view shows for one team: the name and colour of its league
 * Instance. See `useTeamLookup`. */
export interface TeamDisplay {
  name: string;
  colour: string;
  /** The trigram of the league Instance. Empty for an Instance from an older
   * file (Task 121). */
  trigram: string;
  /** The Location of the Blueprint (US-09.3, Task 157). Empty for no
   * Location or a deleted Blueprint. */
  location: string;
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
