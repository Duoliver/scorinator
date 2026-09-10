import {
  openTextFileWithDialog,
  saveTextFileWithDialog,
  tauriDialog,
  tauriFileSystem,
} from '../../adapters/tauri-fs';
import {
  parseTeamsCsv,
  serializeTeamsCsv,
  type TeamCsvRecord,
} from '../../adapters/csv';
import type { FileFilter, FileSystem, SaveFileDialog } from '../../persistence/types';

/** The thin `app/` → `adapters/` data layer `module-boundaries.md`
 * requires. `features/teams` calls these functions instead of importing
 * `adapters/csv` or `adapters/tauri-fs` directly. `fs`/`dialog` default to
 * the real Tauri adapters and are only overridden in tests. */

/** Restricts the open/save dialog to `.csv` files. Without this, both calls
 * fall back to `tauriDialog`'s own default filter (`.json`, built for the
 * save/load feature), which lets a user pick a save file but not a team CSV
 * — the button would claim to import/export CSV while the OS file picker
 * only shows `.json` files. */
const CSV_FILTERS: readonly FileFilter[] = [{ name: 'Team CSV', extensions: ['csv'] }];

export async function importTeamsCsv(
  fs: FileSystem = tauriFileSystem,
  dialog: SaveFileDialog = tauriDialog
): Promise<TeamCsvRecord[] | null> {
  const opened = await openTextFileWithDialog(fs, dialog, CSV_FILTERS);
  if (opened === null) return null;
  return parseTeamsCsv(opened.contents);
}

export async function exportTeamsCsv(
  records: readonly TeamCsvRecord[],
  fs: FileSystem = tauriFileSystem,
  dialog: SaveFileDialog = tauriDialog
): Promise<string | null> {
  const contents = serializeTeamsCsv(records);
  return saveTextFileWithDialog(fs, dialog, contents, 'teams.csv', CSV_FILTERS);
}
