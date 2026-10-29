import { isUuidV4 } from '@/engine/identity';
import type {
  DatabaseFolder,
  FolderFileSystem,
  WrapperText,
} from '@/persistence/types';
import { writeTextFileAtomic } from './atomicWrite';

const MANIFEST_FILE = 'manifest.json';

/** The file name of one wrapper. The UUID check keeps every path inside the
 * folder: a value such as `../x` never becomes a file name. */
function wrapperFile(uuid: string): string {
  if (!isUuidV4(uuid)) {
    throw new RangeError(`A league file name needs a UUID v4. It got "${uuid}".`);
  }
  return `wrapper-${uuid}.json`;
}

/**
 * The `DatabaseFolder` contract on a real folder (Task 107, Task 76 a and b):
 * `manifest.json` plus one `wrapper-{uuid}.json` for each league
 * (`PERSISTENCE.md` §2). It moves text only.
 *
 * `save` makes the folder when it does not exist, writes each wrapper in the
 * given order, then the manifest, each with `writeTextFileAtomic`. At the
 * first failed write it stops and rejects, so the manifest is never newer
 * than a wrapper it names. A crash leaves an extra wrapper file at worst
 * (`PERSISTENCE.md` §3).
 */
export function createDatabaseFolder(
  fs: FolderFileSystem,
  folderPath: string
): DatabaseFolder {
  const pathOf = (file: string): string => `${folderPath}/${file}`;

  return {
    async readManifest(): Promise<string | null> {
      const path = pathOf(MANIFEST_FILE);
      return (await fs.exists(path)) ? fs.readTextFile(path) : null;
    },

    async readWrapper(uuid): Promise<string> {
      const path = pathOf(wrapperFile(uuid));
      if (!(await fs.exists(path))) {
        throw new Error(`The database has no file for the league ${uuid}.`);
      }
      return fs.readTextFile(path);
    },

    async save(
      wrappers: readonly WrapperText[],
      manifest: string | null
    ): Promise<void> {
      // Check every name before the first write, so a bad UUID writes nothing.
      const files = wrappers.map((wrapper) => ({
        path: pathOf(wrapperFile(wrapper.uuid)),
        contents: wrapper.contents,
      }));
      if (files.length === 0 && manifest === null) return;

      await fs.mkdir(folderPath);
      for (const file of files) {
        await writeTextFileAtomic(fs, file.path, file.contents);
      }
      if (manifest !== null) {
        await writeTextFileAtomic(fs, pathOf(MANIFEST_FILE), manifest);
      }
    },
  };
}
