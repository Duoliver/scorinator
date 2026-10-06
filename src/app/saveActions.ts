import { saveLeagueFile, saveLeagueFileAs } from '@/app/data/leagueFile';
import {
  markLeagueSaved,
  setCurrentLeague,
  setFileStatus,
  setLeaguePath,
} from '@/app/state/fileActions';
import { useFileStore } from '@/app/state/fileStore';
import { useLeagueStore } from '@/app/state/leagueStore';
import { useTeamsStore } from '@/app/state/teamsStore';

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
  const league = useLeagueStore
    .getState()
    .leagues.find((candidate) => candidate.slug === slug);
  if (!league) {
    setFileStatus({
      tone: 'error',
      message: `Cannot save: league "${slug}" was not found.`,
    });
    return false;
  }

  const roster = useTeamsStore.getState().teams;
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
    setFileStatus({ tone: 'error', message: (error as Error).message });
    return false;
  }
}

/** Ctrl+S: saves the current league (the last one created, opened, or
 * loaded), from any screen. */
export async function saveCurrentLeague(): Promise<void> {
  const { currentLeagueSlug } = useFileStore.getState();
  if (currentLeagueSlug === null) {
    setFileStatus({
      tone: 'info',
      message: 'No league to save. Open or create a league first.',
    });
    return;
  }
  await saveLeagueBySlug(currentLeagueSlug);
}
