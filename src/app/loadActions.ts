import { importTeamsCsv } from '@/app/data/teamsCsv';
import { importTeamsFile } from '@/app/data/teamsFile';
import { importTeamsJson } from '@/app/data/teamsJson';
import { getErrorMessage } from '@/app/getErrorMessage';
import { setFileStatus } from '@/app/state/fileActions';
import { importTeamBlueprints } from '@/app/state/teamBlueprintActions';
import type { TeamListRecord } from '@/persistence/types';

/** The team imports, as app actions, so every screen loads a team file the
 * same way. Each one reports through `fileStore`'s status line and never
 * throws. A league lives in the database, so no league file loads here
 * until Task 149 (Task 161). */

/** Imports a team list from one dialog that takes `.csv` or `.json`. */
export function importTeamsFromFile(): Promise<void> {
  return importTeams(importTeamsFile);
}

/** Imports a team list from a `.csv` file. */
export function importTeamsFromCsv(): Promise<void> {
  return importTeams(importTeamsCsv);
}

/** Imports a team list from a `.json` file. */
export function importTeamsFromJson(): Promise<void> {
  return importTeams(importTeamsJson);
}

/** The import message, with the counts that `importTeamBlueprints` gives
 * (Task 109). */
export function describeTeamImport(added: number, updated: number): string {
  const total = added + updated;
  return `Imported ${total} team${total === 1 ? '' : 's'}: ${added} new, ${updated} updated.`;
}

/** Runs one `app/data` team import and adds or updates the Blueprints by
 * slug (Task 75 rule). The importer is called with no argument, so it uses
 * the real Tauri file system and dialog. */
async function importTeams(
  importer: () => Promise<TeamListRecord[] | null>
): Promise<void> {
  try {
    const imported = await importer();
    if (imported === null) return;
    const { added, updated } = importTeamBlueprints(imported);
    setFileStatus({ tone: 'info', message: describeTeamImport(added, updated) });
  } catch (error) {
    setFileStatus({ tone: 'error', message: getErrorMessage(error) });
  }
}
