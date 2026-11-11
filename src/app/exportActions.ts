import { saveDatabaseZipFile } from '@/app/data/databaseZip';
import {
  saveBlueprintsFile,
  saveLeagueFile,
  saveLeaguesFile,
} from '@/app/data/exportFile';
import { exportResultsTxt } from '@/app/data/resultsTxt';
import { exportSlugListTxt } from '@/app/data/slugListTxt';
import { exportTeamsCsv } from '@/app/data/teamsCsv';
import { getErrorMessage } from '@/app/getErrorMessage';
import { useDatabaseStore } from '@/app/state/databaseStore';
import { exportDatabaseZip, readAllLeagues } from '@/app/state/databaseZipActions';
import { setStatusLine } from '@/app/state/statusLineActions';
import type { LeagueWrapper } from '@/domain';

/** The export actions of the File screen, the same shape as
 * `saveActions.ts` and `loadActions.ts`. Each one reports through
 * `statusLineStore`'s status line and never throws. An export is not a save, so
 * it changes no unsaved marker. */

/** Runs one export with a save dialog, and reports the path, the cancel,
 * or the error. */
async function reportExport(write: () => Promise<string | null>): Promise<void> {
  try {
    const path = await write();
    setStatusLine({
      tone: 'info',
      message: path === null ? 'Export canceled.' : `Saved to ${path}`,
    });
  } catch (error) {
    setStatusLine({ tone: 'error', message: getErrorMessage(error) });
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

/** Writes one league to its own league file, with its Blueprint snapshots
 * (US-10.1). */
export function exportLeague(league: LeagueWrapper): Promise<void> {
  return reportExport(() =>
    saveLeagueFile(league, useDatabaseStore.getState().blueprints)
  );
}

/** Writes the plain-text results summary of one league (US-10.6). */
export function exportResults(league: LeagueWrapper): Promise<void> {
  return reportExport(() => exportResultsTxt(league));
}

/** Writes the slug list of one league, in its final ranking (US-10.5). */
export function exportSlugList(league: LeagueWrapper): Promise<void> {
  return reportExport(() => exportSlugListTxt(league));
}
