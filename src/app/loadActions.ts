import { loadLeagueFile, type LoadedLeagueFile } from '@/app/data/leagueFile';
import { importTeamsCsv } from '@/app/data/teamsCsv';
import { importTeamsFile } from '@/app/data/teamsFile';
import { importTeamsJson } from '@/app/data/teamsJson';
import { getErrorMessage } from '@/app/getErrorMessage';
import {
  markLeagueSaved,
  setCurrentLeague,
  setFileStatus,
  setLeaguePath,
} from '@/app/state/fileActions';
import { loadLeague } from '@/app/state/leagueActions';
import { findLeague, useLeagueStore } from '@/app/state/leagueStore';
import { importTeamBlueprints } from '@/app/state/teamBlueprintActions';
import type { TeamListRecord } from '@/persistence/types';

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
    setFileStatus({ tone: 'error', message: getErrorMessage(error) });
    return null;
  }
}

export function isLeagueOpen(slug: string): boolean {
  return findLeague(useLeagueStore.getState().leagues, slug) !== undefined;
}

/** Opens a loaded league: it replaces an open league with the same slug,
 * adds or updates the file's teams in the Blueprints by slug (Task 75 rule,
 * Task 109), remembers the file path, and marks the league saved (Task 26). */
export function applyLoadedLeague(loaded: LoadedLeagueFile): void {
  loadLeague(loaded.league);
  importTeamBlueprints(loaded.teams);
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
