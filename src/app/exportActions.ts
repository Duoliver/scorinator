import { saveDatabaseZipFile } from '@/app/data/databaseZip';
import { saveBlueprintsFile, saveLeaguesFile } from '@/app/data/exportFile';
import { exportResultsTxt } from '@/app/data/resultsTxt';
import { exportTeamsCsv } from '@/app/data/teamsCsv';
import { getErrorMessage } from '@/app/getErrorMessage';
import { openLeague } from '@/app/state/databaseActions';
import { currentRows, useDatabaseStore } from '@/app/state/databaseStore';
import { exportDatabaseZip, readAllLeagues } from '@/app/state/databaseZipActions';
import { setFileStatus } from '@/app/state/fileActions';

/** The export actions of the File screen, the same shape as
 * `saveActions.ts` and `loadActions.ts`. Each one reports through
 * `fileStore`'s status line and never throws. An export is not a save, so
 * it changes no unsaved marker. */

/** Runs one export with a save dialog, and reports the path, the cancel,
 * or the error. */
async function reportExport(write: () => Promise<string | null>): Promise<void> {
  try {
    const path = await write();
    setFileStatus({
      tone: 'info',
      message: path === null ? 'Export canceled.' : `Saved to ${path}`,
    });
  } catch (error) {
    setFileStatus({ tone: 'error', message: getErrorMessage(error) });
  }
}

/** Writes every Blueprint to a team CSV file. */
export function exportTeams(): Promise<void> {
  return reportExport(() => exportTeamsCsv(useDatabaseStore.getState().blueprints));
}

/** Writes every league to one league file, with the unsaved changes
 * (US-10.2). */
export function exportAllLeagues(): Promise<void> {
  return reportExport(async () =>
    saveLeaguesFile(await readAllLeagues(), useDatabaseStore.getState().blueprints)
  );
}

/** Writes every Blueprint to one Blueprint file (US-10.2). */
export function exportAllBlueprints(): Promise<void> {
  return reportExport(() => saveBlueprintsFile(useDatabaseStore.getState().blueprints));
}

/** Writes the whole database to one `.zip`, from the live state (US-10.4). */
export function exportDatabase(): Promise<void> {
  return reportExport(async () => saveDatabaseZipFile(await exportDatabaseZip()));
}

/** Writes the plain-text results summary of one league (Task 18). A league
 * that is not open yet is read from the database first (Task 161). */
export async function exportResults(uuid: string): Promise<void> {
  const known = currentRows(useDatabaseStore.getState()).some(
    (row) => row.uuid === uuid
  );
  if (!known) {
    setFileStatus({
      tone: 'error',
      message: 'Cannot export: the league was not found.',
    });
    return;
  }
  try {
    const league = await openLeague(uuid);
    const path = await exportResultsTxt(league);
    setFileStatus({
      tone: 'info',
      message:
        path === null
          ? 'Export canceled.'
          : `Exported ${league.content.name} results to ${path}`,
    });
  } catch (error) {
    setFileStatus({ tone: 'error', message: getErrorMessage(error) });
  }
}
