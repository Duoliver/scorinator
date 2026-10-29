import { appDataDir, join } from '@tauri-apps/api/path';
import type { DatabaseFolder } from '@/persistence/types';
import { createDatabaseFolder } from './databaseFolder';
import { tauriFileSystem } from './tauriFileSystem';

/** The folder name of the database inside the app data folder (Task 107).
 * Other app files can then sit beside it, apart from the database. */
const DATABASE_FOLDER = 'database';

/** The `DatabaseFolder` of this installation: `database/` in the Tauri app
 * data folder, one database for each installation (Task 76 a). It needs
 * Tauri, so it has no unit test. The M1 smoke check (Task 110) runs it. */
export async function openTauriDatabaseFolder(): Promise<DatabaseFolder> {
  const folderPath = await join(await appDataDir(), DATABASE_FOLDER);
  return createDatabaseFolder(tauriFileSystem, folderPath);
}
