import { importTeamsCsv } from '@/app/data/teamsCsv';
import { importTeamsFile } from '@/app/data/teamsFile';
import { importTeamsJson } from '@/app/data/teamsJson';
import { getErrorMessage } from '@/app/getErrorMessage';
import { setFileStatus } from '@/app/state/fileActions';
import {
  importTeamBlueprints,
  previewTeamImport,
} from '@/app/state/teamBlueprintActions';
import type { TeamListRecord } from '@/persistence/types';

/** The team imports, as app actions, so every screen loads a team file the
 * same way. An import has two steps, so the screen can ask first (Task 75,
 * Task 168): a `readTeamsFrom*` action reads the file and gives the counts,
 * then `applyTeamImport` changes the Blueprints. Each one reports through
 * `fileStore`'s status line and never throws. A league lives in the
 * database, so no league file loads here until Task 149 (Task 161). */

/** A team file that is read but not applied yet, with the counts of
 * `previewTeamImport` for the confirm. */
export interface TeamImportPreview {
  records: TeamListRecord[];
  added: number;
  updated: number;
}

/** Reads a team list from one dialog that takes `.csv` or `.json`. */
export function readTeamsFromFile(): Promise<TeamImportPreview | null> {
  return readTeams(importTeamsFile);
}

/** Reads a team list from a `.csv` file. */
export function readTeamsFromCsv(): Promise<TeamImportPreview | null> {
  return readTeams(importTeamsCsv);
}

/** Reads a team list from a `.json` file. */
export function readTeamsFromJson(): Promise<TeamImportPreview | null> {
  return readTeams(importTeamsJson);
}

/** Adds or updates the Blueprints by slug (Task 75 rule), and reports the
 * counts that `importTeamBlueprints` gives. */
export function applyTeamImport(records: readonly TeamListRecord[]): void {
  try {
    const { added, updated } = importTeamBlueprints(records);
    setFileStatus({ tone: 'info', message: describeTeamImport(added, updated) });
  } catch (error) {
    setFileStatus({ tone: 'error', message: getErrorMessage(error) });
  }
}

/** The import message, with the counts that `importTeamBlueprints` gives
 * (Task 109). */
export function describeTeamImport(added: number, updated: number): string {
  const total = added + updated;
  return `Imported ${total} team${total === 1 ? '' : 's'}: ${added} new, ${updated} updated.`;
}

/** Runs one `app/data` team import and counts the changes, with no change
 * to the Blueprints. Gives `null` when the user cancels the dialog, when the
 * read fails, and when the file has no team (Task 119 choice 10). The
 * importer is called with no argument, so it uses the real Tauri file
 * system and dialog. */
async function readTeams(
  importer: () => Promise<TeamListRecord[] | null>
): Promise<TeamImportPreview | null> {
  try {
    const records = await importer();
    if (records === null) return null;
    if (records.length === 0) {
      setFileStatus({ tone: 'info', message: 'The file has no teams.' });
      return null;
    }
    return { records, ...previewTeamImport(records) };
  } catch (error) {
    setFileStatus({ tone: 'error', message: getErrorMessage(error) });
    return null;
  }
}
