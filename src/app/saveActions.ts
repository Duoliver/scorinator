import { getErrorMessage } from '@/app/getErrorMessage';
import { saveDatabase } from '@/app/state/databaseActions';
import { isDatabaseUnsaved, useDatabaseStore } from '@/app/state/databaseStore';
import { setFileStatus } from '@/app/state/fileActions';

/** Ctrl+S, from any screen, and Save in the close guard (Task 76 b, Task
 * 161). One `saveDatabase` call writes each unsaved league, then the
 * manifest. It never throws: a failed save becomes an error status, not an
 * unhandled rejection from a key handler. Resolves to `false` only when a
 * save was needed and did not happen, so the close guard (Task 28) keeps
 * the window open. */
export async function saveDatabaseChanges(): Promise<boolean> {
  try {
    const state = useDatabaseStore.getState();
    if (state.status.kind === 'open' && !isDatabaseUnsaved(state)) {
      setFileStatus({ tone: 'info', message: 'Nothing to save.' });
      return true;
    }
    // Throws for a closed database, with the message the status shows.
    await saveDatabase();
    setFileStatus({ tone: 'info', message: 'Saved.' });
    return true;
  } catch (error) {
    setFileStatus({ tone: 'error', message: getErrorMessage(error) });
    return false;
  }
}
