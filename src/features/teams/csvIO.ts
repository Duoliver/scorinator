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
import type { FileSystem, SaveFileDialog } from '../../persistence/types';

/** The thin `features/` → `adapters/` seam the module boundaries require:
 * `features/teams` never imports `adapters/csv` or `adapters/tauri-fs`
 * anywhere else. `fs`/`dialog` default to the real Tauri adapters and are
 * only overridden in tests. */

export async function importTeamsCsv(
  fs: FileSystem = tauriFileSystem,
  dialog: SaveFileDialog = tauriDialog
): Promise<TeamCsvRecord[] | null> {
  const opened = await openTextFileWithDialog(fs, dialog);
  if (opened === null) return null;
  return parseTeamsCsv(opened.contents);
}

export async function exportTeamsCsv(
  records: readonly TeamCsvRecord[],
  fs: FileSystem = tauriFileSystem,
  dialog: SaveFileDialog = tauriDialog
): Promise<string | null> {
  const contents = serializeTeamsCsv(records);
  return saveTextFileWithDialog(fs, dialog, contents, 'teams.csv');
}
