import { tauriDialog, tauriFileSystem } from '@/adapters/tauri-fs';
import { parseTeamsCsv, type TeamCsvRecord } from '@/adapters/csv';
import { parseTeamsJson } from '@/adapters/json-io';
import type { FileFilter, FileSystem, SaveFileDialog } from '@/persistence/types';

/** A team import that takes either format (Task 29), for the Leagues
 * empty state's single "Load teams" button. It opens one dialog for `.csv`
 * and `.json`, and picks the parser by the file extension. The File screen
 * keeps its two single-format imports, `teamsCsv.ts` and `teamsJson.ts`. */
const TEAM_LIST_FILTERS: readonly FileFilter[] = [
  { name: 'Team list', extensions: ['csv', 'json'] },
];

export async function importTeamsFile(
  fs: FileSystem = tauriFileSystem,
  dialog: SaveFileDialog = tauriDialog
): Promise<TeamCsvRecord[] | null> {
  const path = await dialog.pickOpenPath(TEAM_LIST_FILTERS);
  if (path === null) return null;

  // The dialog filter is only a hint: some platforms let the user pick any file.
  const extension = path.slice(path.lastIndexOf('.') + 1).toLowerCase();
  if (extension !== 'csv' && extension !== 'json') {
    throw new Error(`Cannot load "${path}": pick a .csv or .json team list.`);
  }

  const contents = await fs.readTextFile(path);
  return extension === 'csv' ? parseTeamsCsv(contents) : parseTeamsJson(contents);
}
