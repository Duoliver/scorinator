import {
  openTextFileWithDialog,
  saveTextFileWithDialog,
  tauriDialog,
  tauriFileSystem,
} from '@/adapters/tauri-fs';
import { parseSlugList, serializeSlugList } from '@/adapters/txt';
import { slug } from '@/engine/identity';
import { leagueFinalRanking } from '@/app/state/finalRanking';
import type { LeagueWrapper } from '@/domain';
import type { FileFilter, FileSystem, SaveFileDialog } from '@/persistence/types';

/** The thin `app/` → `adapters/` data layer for "Import slug list"
 * (US-08.7), so `features/` never imports `adapters/` directly. */

const SLUG_LIST_FILTERS: readonly FileFilter[] = [
  { name: 'Slug list', extensions: ['txt'] },
];

/** The save dialog filter of the export, as `resultsTxt.ts` has it. */
const TXT_FILTERS: readonly FileFilter[] = [{ name: 'Text file', extensions: ['txt'] }];

/** The slugs of a `.txt` file the user picks, or `null` on Cancel. Rejects
 * with the line error of `parseSlugList` (Task 118). */
export async function importSlugListTxt(
  fs: FileSystem = tauriFileSystem,
  dialog: SaveFileDialog = tauriDialog
): Promise<string[] | null> {
  const opened = await openTextFileWithDialog(fs, dialog, SLUG_LIST_FILTERS);
  if (opened === null) return null;
  return parseSlugList(opened.contents);
}

/** The local date of `today` as `YYYY-MM-DD`, for the comment line. */
function localDate(today: Date): string {
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${today.getFullYear()}-${month}-${day}`;
}

/**
 * "Export slug list (.txt)" (US-10.5, Task 148): asks where to write the
 * Instance slugs of a league in its final ranking (Task 147), then writes
 * them with the comment line. The default name is `<league slug>-ranking.txt`
 * (choice 4). An Instance keeps its slug after its Blueprint is deleted, so
 * every team is in the file (US-09.4). Returns the path written, or `null`
 * if the user cancels the dialog.
 */
export async function exportSlugListTxt(
  wrapper: LeagueWrapper,
  today: Date = new Date(),
  fs: FileSystem = tauriFileSystem,
  dialog: SaveFileDialog = tauriDialog
): Promise<string | null> {
  const slugOf = new Map(wrapper.teams.map((team) => [team.blueprintUuid, team.slug]));
  const contents = serializeSlugList({
    leagueName: wrapper.content.name,
    date: localDate(today),
    slugs: leagueFinalRanking(wrapper).map((uuid) => slugOf.get(uuid) ?? uuid),
  });
  return saveTextFileWithDialog(
    fs,
    dialog,
    contents,
    `${slug(wrapper.content.name)}-ranking.txt`,
    TXT_FILTERS
  );
}
