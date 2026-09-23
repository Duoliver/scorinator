import { saveLeagueFile, saveLeagueFileAs } from '@/app/data/leagueFile';
import { useFileStore } from '@/app/state/fileStore';
import { useLeagueStore } from '@/app/state/leagueStore';
import { useTeamsStore } from '@/app/state/teamsStore';

/** The save action Ctrl+S (`AppShell`) and the File screen's Save and Save
 * as buttons share, so the two cannot drift apart. It reads the stores,
 * calls the `app/data` save, remembers the path it got, and writes the
 * outcome to `fileStore`'s status line. It never throws: a failed save
 * becomes an error status, not an unhandled rejection from a key handler. */
export async function saveLeagueBySlug(
  slug: string,
  options: { saveAs?: boolean } = {}
): Promise<void> {
  const { setPath, setCurrent, setStatus } = useFileStore.getState();
  const league = useLeagueStore.getState().leagues.find((candidate) => candidate.slug === slug);
  if (!league) {
    setStatus({ tone: 'error', message: `Cannot save: league "${slug}" was not found.` });
    return;
  }

  const roster = useTeamsStore.getState().teams;
  const knownPath = useFileStore.getState().paths[slug] ?? null;
  try {
    const path = options.saveAs
      ? await saveLeagueFileAs(league, roster, knownPath)
      : await saveLeagueFile(league, roster, knownPath);
    if (path === null) {
      setStatus({ tone: 'info', message: 'Save canceled.' });
      return;
    }
    setPath(slug, path);
    setCurrent(slug);
    setStatus({ tone: 'info', message: `Saved ${league.name} to ${path}` });
  } catch (error) {
    setStatus({ tone: 'error', message: (error as Error).message });
  }
}

/** Ctrl+S: saves the current league (the last one created, opened, or
 * loaded), from any screen. */
export async function saveCurrentLeague(): Promise<void> {
  const { currentLeagueSlug, setStatus } = useFileStore.getState();
  if (currentLeagueSlug === null) {
    setStatus({ tone: 'info', message: 'No league to save. Open or create a league first.' });
    return;
  }
  await saveLeagueBySlug(currentLeagueSlug);
}
