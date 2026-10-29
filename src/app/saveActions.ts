import { saveLeagueFile, saveLeagueFileAs } from '@/app/data/leagueFile';
import { getErrorMessage } from '@/app/getErrorMessage';
import {
  markLeagueSaved,
  setCurrentLeague,
  setFileStatus,
  setLeaguePath,
} from '@/app/state/fileActions';
import { useFileStore } from '@/app/state/fileStore';
import { findLeague, useLeagueStore } from '@/app/state/leagueStore';
import { saveDatabase } from '@/app/state/databaseActions';
import { isManifestUnsaved, useDatabaseStore } from '@/app/state/databaseStore';

/** The save action Ctrl+S (`AppShell`) and the File screen's Save and Save
 * as buttons share, so the two cannot drift apart. It reads the stores,
 * calls the `app/data` save, remembers the path it got, and writes the
 * outcome to `fileStore`'s status line. It never throws: a failed save
 * becomes an error status, not an unhandled rejection from a key handler.
 * Resolves to `true` only when the league was written: a canceled dialog, an
 * error, and an unknown slug resolve to `false`. The close guard (Task 28)
 * needs this to keep the window open after a save that did not happen. */
export async function saveLeagueBySlug(
  slug: string,
  options: { saveAs?: boolean } = {}
): Promise<boolean> {
  const league = findLeague(useLeagueStore.getState().leagues, slug);
  if (!league) {
    setFileStatus({
      tone: 'error',
      message: `Cannot save: league "${slug}" was not found.`,
    });
    return false;
  }

  const roster = useDatabaseStore.getState().blueprints;
  const knownPath = useFileStore.getState().paths[slug] ?? null;
  try {
    const path = options.saveAs
      ? await saveLeagueFileAs(league, roster, knownPath)
      : await saveLeagueFile(league, roster, knownPath);
    if (path === null) {
      setFileStatus({ tone: 'info', message: 'Save canceled.' });
      return false;
    }
    setLeaguePath(slug, path);
    // The object read before the write, not whatever the store holds now: a
    // change made while the file was writing stays unsaved (Task 26).
    markLeagueSaved(league);
    setCurrentLeague(slug);
    setFileStatus({ tone: 'info', message: `Saved ${league.name} to ${path}` });
    return true;
  } catch (error) {
    setFileStatus({ tone: 'error', message: getErrorMessage(error) });
    return false;
  }
}

/** Saves the database when it has unsaved changes: in M1, the Blueprints
 * (Task 109). Never throws: a failed save becomes an error status. Resolves
 * to `false` only for a failed save, so the close guard keeps the window
 * open. */
export async function saveTeams(): Promise<boolean> {
  const database = useDatabaseStore.getState();
  if (database.status.kind !== 'open' || !isManifestUnsaved(database)) return true;
  try {
    await saveDatabase();
    setFileStatus({ tone: 'info', message: 'Saved the teams.' });
    return true;
  } catch (error) {
    setFileStatus({ tone: 'error', message: getErrorMessage(error) });
    return false;
  }
}

/** Ctrl+S: saves the database when it has unsaved changes, then the current
 * league (the last one created, opened, or loaded), from any screen. In M1
 * the leagues still have their own save files: Task 161 makes Ctrl+S save
 * the database only. */
export async function saveCurrentLeague(): Promise<void> {
  const teamsUnsaved = isManifestUnsaved(useDatabaseStore.getState());
  if (!(await saveTeams())) return;
  const { currentLeagueSlug } = useFileStore.getState();
  if (currentLeagueSlug === null) {
    if (!teamsUnsaved) {
      setFileStatus({
        tone: 'info',
        message: 'No league to save. Open or create a league first.',
      });
    }
    return;
  }
  await saveLeagueBySlug(currentLeagueSlug);
}
