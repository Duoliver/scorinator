import { exportResultsTxt } from '@/app/data/resultsTxt';
import { exportTeamsCsv } from '@/app/data/teamsCsv';
import { getErrorMessage } from '@/app/getErrorMessage';
import { openLeague } from '@/app/state/databaseActions';
import { currentRows, useDatabaseStore } from '@/app/state/databaseStore';
import { setFileStatus } from '@/app/state/fileActions';

/** The export actions of the File screen, the same shape as
 * `saveActions.ts` and `loadActions.ts`. Each one reports through
 * `fileStore`'s status line and never throws. An export is not a save, so
 * it changes no unsaved marker. */

/** Writes every Blueprint to a team CSV file. */
export async function exportTeams(): Promise<void> {
  try {
    const path = await exportTeamsCsv(useDatabaseStore.getState().blueprints);
    setFileStatus({
      tone: 'info',
      message: path === null ? 'Export canceled.' : `Saved to ${path}`,
    });
  } catch (error) {
    setFileStatus({ tone: 'error', message: getErrorMessage(error) });
  }
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
