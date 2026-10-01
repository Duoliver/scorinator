import {
  saveTextFileWithDialog,
  tauriDialog,
  tauriFileSystem,
} from '@/adapters/tauri-fs';
import { serializeResultsTxt } from '@/adapters/txt';
import type { FileFilter, FileSystem, SaveFileDialog } from '@/persistence/types';
import type { TeamRecord } from '@/features/components';
import type { LeagueRecord } from '@/features/leagues/types';
import { leagueToSaved } from './leagueFile';

/** The thin `app/` → `adapters/` data layer for the results export (Task
 * 18), the same seam `teamsCsv.ts` is for team CSV. `features/file` calls
 * this instead of `adapters/txt` or `adapters/tauri-fs`. `fs`/`dialog`
 * default to the real Tauri adapters and are only overridden in tests. */

/** Restricts the save dialog to `.txt` files, for the same reason
 * `teamsCsv.ts` restricts its dialog to `.csv`: without it the dialog falls
 * back to its default `.json` filter. */
const TXT_FILTERS: readonly FileFilter[] = [{ name: 'Text file', extensions: ['txt'] }];

/** Asks where to write the plain-text results summary of one league, then
 * writes it. `leagueToSaved` joins each league team with its roster entry,
 * so the text shows team names and not slugs. Returns the path written, or
 * `null` if the user cancels the dialog. Throws if a league team is no
 * longer in the roster, before the dialog opens. */
export async function exportResultsTxt(
  league: LeagueRecord,
  roster: readonly TeamRecord[],
  fs: FileSystem = tauriFileSystem,
  dialog: SaveFileDialog = tauriDialog
): Promise<string | null> {
  const contents = serializeResultsTxt(leagueToSaved(league, roster));
  return saveTextFileWithDialog(
    fs,
    dialog,
    contents,
    `${league.slug}-results.txt`,
    TXT_FILTERS
  );
}
