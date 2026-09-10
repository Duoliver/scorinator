import {
  openTextFileWithDialog,
  tauriDialog,
  tauriFileSystem,
} from '../../adapters/tauri-fs';
import { parseTeamsJson } from '../../adapters/json-io';
import type { TeamCsvRecord } from '../../adapters/csv';
import type { FileFilter, FileSystem, SaveFileDialog } from '../../persistence/types';

/** The JSON-format sibling of `teamsCsv.ts`'s CSV import — same thin
 * `app/` → `adapters/` data layer, same `fs`/`dialog` override-in-tests
 * pattern. Imports a plain team-list JSON file, not a full league save
 * (`adapters/json-io`'s `parseLeague`/`SavedLeague`) — that is Task 17's
 * Save/Load feature, out of scope here. */
const TEAM_JSON_FILTERS: readonly FileFilter[] = [
  { name: 'Team JSON', extensions: ['json'] },
];

export async function importTeamsJson(
  fs: FileSystem = tauriFileSystem,
  dialog: SaveFileDialog = tauriDialog
): Promise<TeamCsvRecord[] | null> {
  const opened = await openTextFileWithDialog(fs, dialog, TEAM_JSON_FILTERS);
  if (opened === null) return null;
  return parseTeamsJson(opened.contents);
}
