import type { FileSystem, SaveFileDialog } from '../../persistence/types';
import { writeTextFileAtomic } from './atomicWrite';

/**
 * Asks the user, through the OS save dialog, where to write `contents`.
 * Returns the chosen path, or `null` if the user cancels. Stays text-only —
 * callers that want to save a specific shape (e.g. a league) serialize it
 * to text first.
 */
export async function saveTextFileWithDialog(
  fs: FileSystem,
  dialog: SaveFileDialog,
  contents: string,
  defaultPath?: string
): Promise<string | null> {
  const path = await dialog.pickSavePath(defaultPath);
  if (path === null) return null;

  await writeTextFileAtomic(fs, path, contents);
  return path;
}

/**
 * Asks the user, through the OS open dialog, which file to read. Returns
 * the chosen path and its contents, or `null` if the user cancels.
 */
export async function openTextFileWithDialog(
  fs: FileSystem,
  dialog: SaveFileDialog
): Promise<{ path: string; contents: string } | null> {
  const path = await dialog.pickOpenPath();
  if (path === null) return null;

  const contents = await fs.readTextFile(path);
  return { path, contents };
}
