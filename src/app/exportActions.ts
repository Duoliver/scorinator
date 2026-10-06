import { teamRecordToCsvRecord } from '@/app/data/importMerge';
import { exportResultsTxt } from '@/app/data/resultsTxt';
import { exportTeamsCsv } from '@/app/data/teamsCsv';
import { setFileStatus } from '@/app/state/fileActions';
import { useLeagueStore } from '@/app/state/leagueStore';
import { useTeamsStore } from '@/app/state/teamsStore';

/** The export actions of the File screen, the same shape as
 * `saveActions.ts` and `loadActions.ts`. Each one reports through
 * `fileStore`'s status line and never throws. An export leaves the saved
 * path and the current league alone, since an export is not a save file. */

/** Writes the whole roster to a team CSV file. */
export async function exportTeams(): Promise<void> {
  try {
    const path = await exportTeamsCsv(
      useTeamsStore.getState().teams.map(teamRecordToCsvRecord)
    );
    setFileStatus({
      tone: 'info',
      message: path === null ? 'Export canceled.' : `Saved to ${path}`,
    });
  } catch (error) {
    setFileStatus({ tone: 'error', message: (error as Error).message });
  }
}

/** Writes the plain-text results summary of one league (Task 18). */
export async function exportResultsBySlug(slug: string): Promise<void> {
  const league = useLeagueStore
    .getState()
    .leagues.find((candidate) => candidate.slug === slug);
  if (!league) {
    setFileStatus({
      tone: 'error',
      message: `Cannot export: league "${slug}" was not found.`,
    });
    return;
  }
  try {
    const path = await exportResultsTxt(league, useTeamsStore.getState().teams);
    setFileStatus({
      tone: 'info',
      message:
        path === null
          ? 'Export canceled.'
          : `Exported ${league.name} results to ${path}`,
    });
  } catch (error) {
    setFileStatus({ tone: 'error', message: (error as Error).message });
  }
}
