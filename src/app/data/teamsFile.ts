import { tauriDialog, tauriFileSystem } from '@/adapters/tauri-fs';
import { parseTeamsCsv } from '@/adapters/csv';
import { parseTeamsJson } from '@/adapters/json-io';
import type { FileFilter, FileSystem, SaveFileDialog } from '@/persistence/types';
import type { TeamRecord } from '@/domain';
import { teamListRecordToTeamRecord } from './importMerge';

/** A team import that takes either format (Task 29): one dialog for `.csv`
 * and `.json`, and the file extension picks the parser. */
const TEAM_LIST_FILTERS: readonly FileFilter[] = [
  { name: 'Team list', extensions: ['csv', 'json'] },
];

export async function importTeamsFile(
  fs: FileSystem = tauriFileSystem,
  dialog: SaveFileDialog = tauriDialog
): Promise<TeamRecord[] | null> {
  const path = await dialog.pickOpenPath(TEAM_LIST_FILTERS);
  if (path === null) return null;

  // The dialog filter is only a hint: some platforms let the user pick any file.
  const extension = path.slice(path.lastIndexOf('.') + 1).toLowerCase();
  if (extension !== 'csv' && extension !== 'json') {
    throw new Error(`Cannot load "${path}": pick a .csv or .json team list.`);
  }

  const contents = await fs.readTextFile(path);
  const records =
    extension === 'csv' ? parseTeamsCsv(contents) : parseTeamsJson(contents);
  return records.map(teamListRecordToTeamRecord);
}
