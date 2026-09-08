import type { FileSystem } from '../../persistence/types';

/**
 * Writes `contents` to `path` without ever leaving a half-written file in
 * its place. Writes to a sibling temp file first, then renames it over
 * `path` (`FileSystem.rename` overwrites an existing destination). The temp
 * file sits beside the target, not in a system temp directory, so the final
 * rename never crosses filesystems/drives.
 *
 * On any failure, removes the temp file before rethrowing, so a failed save
 * never leaves a stray `.tmp-*` file behind.
 */
export async function writeTextFileAtomic(
  fs: FileSystem,
  path: string,
  contents: string
): Promise<void> {
  const tempPath = `${path}.tmp-${crypto.randomUUID()}`;

  try {
    await fs.writeTextFile(tempPath, contents);
    await fs.rename(tempPath, path);
  } catch (error) {
    if (await fs.exists(tempPath)) {
      await fs.remove(tempPath);
    }
    throw error;
  }
}
