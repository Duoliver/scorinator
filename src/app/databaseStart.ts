import { openTauriDatabaseFolder } from '@/adapters/tauri-fs';
import { getErrorMessage } from '@/app/getErrorMessage';
import { openDatabase } from '@/app/state/databaseActions';
import { useDatabaseStore } from '@/app/state/databaseStore';
import type { DatabaseFolder } from '@/persistence/types';

/** Opens the database of this installation at app start (Task 76 a, Task
 * 109). A folder that cannot be found gives the `error` status, the same as
 * a manifest that cannot be read. It never throws. */
export async function openAppDatabase(
  findFolder: () => Promise<DatabaseFolder> = openTauriDatabaseFolder
): Promise<void> {
  let folder: DatabaseFolder;
  try {
    folder = await findFolder();
  } catch (error) {
    useDatabaseStore.setState({
      ...useDatabaseStore.getInitialState(),
      status: { kind: 'error', message: getErrorMessage(error) },
    });
    return;
  }
  await openDatabase(folder);
}
