import {
  openTextFileWithDialog,
  tauriDialog,
  tauriFileSystem,
} from '@/adapters/tauri-fs';
import { parseSlugList } from '@/adapters/txt';
import type { FileFilter, FileSystem, SaveFileDialog } from '@/persistence/types';

/** The thin `app/` → `adapters/` data layer for "Import slug list"
 * (US-08.7), so `features/` never imports `adapters/` directly. */

const SLUG_LIST_FILTERS: readonly FileFilter[] = [
  { name: 'Slug list', extensions: ['txt'] },
];

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
