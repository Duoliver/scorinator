import { tauriWindow, type WindowCloseAdapter } from '@/adapters/tauri-window';
import { getErrorMessage } from '@/app/getErrorMessage';
import { saveDatabaseChanges } from '@/app/saveActions';
import {
  areBlueprintsUnsaved,
  unsavedLeagues,
  useDatabaseStore,
} from '@/app/state/databaseStore';
import { setFileStatus } from '@/app/state/fileActions';

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

/** The name the dialog uses for unsaved Blueprints (Task 109). */
export const UNSAVED_TEAMS_NAME = 'Teams';

/** Decides whether the window may close. No unsaved league and no unsaved
 * Blueprint: yes, with no prompt. Otherwise asks, and lists the Blueprints
 * as "Teams" first, then each unsaved league. Save saves the whole database
 * in one call (Task 161), and the close goes ahead only if the save works.
 * Don't save closes with no save. Cancel keeps the window open.
 *
 * A manifest row that is one save behind its league, with no other change,
 * gives no prompt: the league file holds the real values, and the row
 * follows them at the next save (Task 76 edge case). */
export async function allowWindowClose(
  adapter: Pick<WindowCloseAdapter, 'askUnsavedChoice'> = tauriWindow,
  save: () => Promise<boolean> = saveDatabaseChanges
): Promise<boolean> {
  const state = useDatabaseStore.getState();
  const names = [
    ...(areBlueprintsUnsaved(state) ? [UNSAVED_TEAMS_NAME] : []),
    ...unsavedLeagues(state).map((league) => league.content.name),
  ];
  if (names.length === 0) return true;

  const choice = await adapter.askUnsavedChoice(describeUnsavedLeagues(names));
  if (choice === 'cancel') return false;
  if (choice === 'discard') return true;
  return save();
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
      setFileStatus({
        tone: 'error',
        message: `Could not watch for a window close: ${getErrorMessage(error)}`,
      });
    });

  return (): void => {
    active = false;
    stop?.();
  };
}
