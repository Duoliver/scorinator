import { loadLeagueFile, type LoadedLeagueFile } from '@/app/data/leagueFile';
import { mergeImportedTeams } from '@/app/data/importMerge';
import { importTeamsCsv } from '@/app/data/teamsCsv';
import { importTeamsFile } from '@/app/data/teamsFile';
import { importTeamsJson } from '@/app/data/teamsJson';
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
import type { TeamRecord } from '@/domain';

/** The league load and the team imports, as app actions, so every screen
 * loads a file the same way. Each one reports through `fileStore`'s status
 * line and never throws. */

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

/** Runs one `app/data` team import and merges its teams into the roster by
 * slug. The importer is called with no argument, so it uses the real
 * Tauri file system and dialog. */
async function importTeams(
  importer: () => Promise<TeamRecord[] | null>
): Promise<void> {
  try {
    const imported = await importer();
    if (imported === null) return;
    setTeams(mergeImportedTeams(useTeamsStore.getState().teams, imported));
    setFileStatus({
      tone: 'info',
      message: `Imported ${imported.length} team${imported.length === 1 ? '' : 's'}.`,
    });
  } catch (error) {
    setFileStatus({ tone: 'error', message: (error as Error).message });
  }
}
