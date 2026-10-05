import { tauriWindow, type WindowCloseAdapter } from '@/adapters/tauri-window';
import { saveLeagueBySlug } from '@/app/saveActions';
import { isLeagueUnsaved, useFileStore } from '@/app/state/fileStore';
import { useLeagueStore } from '@/app/state/leagueStore';

/** The prompt before the window closes with unsaved changes (Task 28,
 * `PERSISTENCE.md` §2b). A league counts as unsaved by `isLeagueUnsaved`
 * (Task 26). */

const MAX_NAMES_LISTED = 5;

/** The dialog text. The wording is the same for every league count, except
 * for the list. */
export function describeUnsavedLeagues(names: readonly string[]): string {
  if (names.length === 1) {
    return `"${names[0]}" has unsaved changes. Save it before you close?`;
  }
  const quoted = names.slice(0, MAX_NAMES_LISTED).map((name) => `"${name}"`);
  const rest = names.length - MAX_NAMES_LISTED;
  const list = rest > 0 ? `${quoted.join(', ')}, and ${rest} more` : quoted.join(', ');
  return `These leagues have unsaved changes: ${list}. Save them before you close?`;
}

/** Decides whether the window may close. No unsaved league: yes, with no
 * prompt. Otherwise asks. Save saves each unsaved league in turn, and the
 * close goes ahead only if every save works: a canceled save dialog or an
 * error keeps the window open, and leaves the later leagues unsaved. Don't
 * save closes with no save. Cancel keeps the window open. */
export async function allowWindowClose(
  adapter: Pick<WindowCloseAdapter, 'askUnsavedChoice'> = tauriWindow,
  save: (slug: string) => Promise<boolean> = saveLeagueBySlug
): Promise<boolean> {
  const { savedLeagues } = useFileStore.getState();
  const unsaved = useLeagueStore
    .getState()
    .leagues.filter((league) => isLeagueUnsaved(league, savedLeagues));
  if (unsaved.length === 0) return true;

  const choice = await adapter.askUnsavedChoice(
    describeUnsavedLeagues(unsaved.map((league) => league.name))
  );
  if (choice === 'cancel') return false;
  if (choice === 'discard') return true;

  for (const league of unsaved) {
    if (!(await save(league.slug))) return false;
  }
  return true;
}

/** Starts watching for a window close, and returns the function that stops
 * it. Inside Tauri only: the adapter does nothing in a browser. A listener
 * that fails to start goes to the status line, since there is no caller to
 * throw to. */
export function installCloseGuard(
  adapter: WindowCloseAdapter = tauriWindow
): () => void {
  let active = true;
  let stop: (() => void) | undefined;

  adapter
    .listenForCloseRequest(async (request) => {
      if (!(await allowWindowClose(adapter))) request.preventDefault();
    })
    .then((unlisten) => {
      if (active) stop = unlisten;
      else unlisten();
    })
    .catch((error: unknown) => {
      useFileStore.getState().setStatus({
        tone: 'error',
        message: `Could not watch for a window close: ${(error as Error).message}`,
      });
    });

  return (): void => {
    active = false;
    stop?.();
  };
}
