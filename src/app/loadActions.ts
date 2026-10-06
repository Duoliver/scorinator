import type { TeamCsvRecord } from '@/adapters/csv';
import { loadLeagueFile, type LoadedLeagueFile } from '@/app/data/leagueFile';
import { csvRecordToTeamRecord, mergeImportedTeams } from '@/app/data/importMerge';
import {
  markLeagueSaved,
  setCurrentLeague,
  setFileStatus,
  setLeaguePath,
} from '@/app/state/fileActions';
import { loadLeague } from '@/app/state/leagueActions';
import { useLeagueStore } from '@/app/state/leagueStore';
import { setTeams } from '@/app/state/teamsActions';
import { useTeamsStore } from '@/app/state/teamsStore';

/** The load and team-import actions that the File screen and the Leagues
 * empty state (Task 29) share, the same way `saveActions.ts` shares save
 * between the File screen and Ctrl+S. Each one reports through
 * `fileStore`'s status line and never throws. */

/** Asks for a league save file and reads it. Changes no store, so the
 * caller can ask before it replaces an open league (see `isLeagueOpen`).
 * Returns `null` on cancel, or on an error, which goes to the status line. */
export async function openLeagueFile(): Promise<LoadedLeagueFile | null> {
  try {
    return await loadLeagueFile();
  } catch (error) {
    setFileStatus({ tone: 'error', message: (error as Error).message });
    return null;
  }
}

export function isLeagueOpen(slug: string): boolean {
  return useLeagueStore.getState().leagues.some((league) => league.slug === slug);
}

/** Opens a loaded league: it replaces an open league with the same slug,
 * merges the file's teams into the roster, remembers the file path, and
 * marks the league saved (Task 26). */
export function applyLoadedLeague(loaded: LoadedLeagueFile): void {
  loadLeague(loaded.league);
  setTeams(mergeImportedTeams(useTeamsStore.getState().teams, loaded.teams));
  markLeagueSaved(loaded.league);
  setLeaguePath(loaded.league.slug, loaded.path);
  setCurrentLeague(loaded.league.slug);
  setFileStatus({
    tone: 'info',
    message: `Loaded ${loaded.league.name} from ${loaded.path}`,
  });
}

/** Runs one of the `app/data` team imports and merges its teams into the
 * roster by slug. */
export async function importTeams(
  importer: () => Promise<TeamCsvRecord[] | null>
): Promise<void> {
  try {
    const imported = await importer();
    if (imported === null) return;
    const records = imported.map(csvRecordToTeamRecord);
    setTeams(mergeImportedTeams(useTeamsStore.getState().teams, records));
    setFileStatus({
      tone: 'info',
      message: `Imported ${records.length} team${records.length === 1 ? '' : 's'}.`,
    });
  } catch (error) {
    setFileStatus({ tone: 'error', message: (error as Error).message });
  }
}
