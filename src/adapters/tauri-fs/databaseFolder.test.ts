import {
  access,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rename,
  rm,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { FolderFileSystem } from '@/persistence/types';
import { createDatabaseFolder } from './databaseFolder';

const LEAGUE_A = '00000000-0000-4000-8000-0000000000a1';
const LEAGUE_B = '00000000-0000-4000-8000-0000000000a2';

/** A `FolderFileSystem` on real Node `fs` calls, so the write order and the
 * crash cases run against a real disk, not a mock that records calls. */
function nodeFileSystem(): FolderFileSystem {
  return {
    readTextFile: (path) => readFile(path, 'utf-8'),
    writeTextFile: (path, contents) => writeFile(path, contents, 'utf-8'),
    rename: (from, to) => rename(from, to),
    remove: (path) => rm(path),
    exists: async (path): Promise<boolean> => {
      try {
        await access(path);
        return true;
      } catch {
        return false;
      }
    },
    mkdir: async (path): Promise<void> => {
      await mkdir(path, { recursive: true });
    },
  };
}

/** The real file system, plus a log of each finished rename target: the
 * moment a file write becomes final on disk. */
function recordingFileSystem(log: string[]): FolderFileSystem {
  const fs = nodeFileSystem();
  return {
    ...fs,
    rename: async (from, to): Promise<void> => {
      await fs.rename(from, to);
      log.push(to);
    },
  };
}

describe('createDatabaseFolder', () => {
  let root: string;
  let folder: string;

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), 'scorinator-database-'));
    folder = join(root, 'database');
  });

  afterEach(async () => {
    await rm(root, { recursive: true, force: true });
  });

  describe('readManifest', () => {
    it('gives null when the folder does not exist yet', async () => {
      await expect(
        createDatabaseFolder(nodeFileSystem(), folder).readManifest()
      ).resolves.toBe(null);
    });

    it('gives null when the folder has no manifest', async () => {
      await mkdir(folder);
      await expect(
        createDatabaseFolder(nodeFileSystem(), folder).readManifest()
      ).resolves.toBe(null);
    });

    it('gives the manifest text', async () => {
      await mkdir(folder);
      await writeFile(join(folder, 'manifest.json'), '{"m":1}', 'utf-8');
      await expect(
        createDatabaseFolder(nodeFileSystem(), folder).readManifest()
      ).resolves.toBe('{"m":1}');
    });
  });

  describe('readWrapper', () => {
    it('gives the text of wrapper-{uuid}.json', async () => {
      await mkdir(folder);
      await writeFile(join(folder, `wrapper-${LEAGUE_A}.json`), '{"w":1}', 'utf-8');
      await expect(
        createDatabaseFolder(nodeFileSystem(), folder).readWrapper(LEAGUE_A)
      ).resolves.toBe('{"w":1}');
    });

    it('rejects with a clear error when the file does not exist', async () => {
      await mkdir(folder);
      await expect(
        createDatabaseFolder(nodeFileSystem(), folder).readWrapper(LEAGUE_A)
      ).rejects.toThrow(`The database has no file for the league ${LEAGUE_A}.`);
    });

    it('rejects a value that is not a UUID v4, so no path can leave the folder', async () => {
      await writeFile(join(root, 'wrapper-..json'), 'outside', 'utf-8');
      const database = createDatabaseFolder(nodeFileSystem(), folder);
      await expect(database.readWrapper('../x')).rejects.toThrow(
        'A league file name needs a UUID v4. It got "../x".'
      );
      await expect(database.readWrapper('.')).rejects.toThrow(RangeError);
    });
  });

  describe('save', () => {
    it('makes the folder, then writes the wrappers and the manifest', async () => {
      const database = createDatabaseFolder(nodeFileSystem(), folder);
      await database.save(
        [
          { uuid: LEAGUE_A, contents: 'league a' },
          { uuid: LEAGUE_B, contents: 'league b' },
        ],
        'manifest'
      );

      expect((await readdir(folder)).sort()).toEqual([
        'manifest.json',
        `wrapper-${LEAGUE_A}.json`,
        `wrapper-${LEAGUE_B}.json`,
      ]);
      await expect(database.readManifest()).resolves.toBe('manifest');
      await expect(database.readWrapper(LEAGUE_B)).resolves.toBe('league b');
    });

    it('writes the wrappers in the given order, and the manifest last', async () => {
      const log: string[] = [];
      await createDatabaseFolder(recordingFileSystem(log), folder).save(
        [
          { uuid: LEAGUE_B, contents: 'b' },
          { uuid: LEAGUE_A, contents: 'a' },
        ],
        'manifest'
      );

      expect(log).toEqual([
        join(folder, `wrapper-${LEAGUE_B}.json`),
        join(folder, `wrapper-${LEAGUE_A}.json`),
        join(folder, 'manifest.json'),
      ]);
    });

    it('overwrites a saved wrapper and manifest', async () => {
      const database = createDatabaseFolder(nodeFileSystem(), folder);
      await database.save([{ uuid: LEAGUE_A, contents: 'old' }], 'old manifest');
      await database.save([{ uuid: LEAGUE_A, contents: 'new' }], 'new manifest');

      await expect(database.readWrapper(LEAGUE_A)).resolves.toBe('new');
      await expect(database.readManifest()).resolves.toBe('new manifest');
    });

    it('with a null manifest, writes the wrappers only and keeps the manifest', async () => {
      const database = createDatabaseFolder(nodeFileSystem(), folder);
      await database.save([], 'manifest v1');
      await database.save([{ uuid: LEAGUE_A, contents: 'a' }], null);

      await expect(database.readManifest()).resolves.toBe('manifest v1');
      await expect(database.readWrapper(LEAGUE_A)).resolves.toBe('a');
    });

    it('with a null manifest and no manifest yet, writes no manifest', async () => {
      const database = createDatabaseFolder(nodeFileSystem(), folder);
      await database.save([{ uuid: LEAGUE_A, contents: 'a' }], null);

      expect(await readdir(folder)).toEqual([`wrapper-${LEAGUE_A}.json`]);
    });

    it('stops at a failed wrapper write: the earlier wrapper is on disk, the manifest is unchanged', async () => {
      const database = createDatabaseFolder(nodeFileSystem(), folder);
      await database.save([], 'manifest v1');

      const real = nodeFileSystem();
      const failOnB: FolderFileSystem = {
        ...real,
        writeTextFile: async (path, contents) => {
          if (path.includes(LEAGUE_B)) throw new Error('disk full');
          await real.writeTextFile(path, contents);
        },
      };
      await expect(
        createDatabaseFolder(failOnB, folder).save(
          [
            { uuid: LEAGUE_A, contents: 'a' },
            { uuid: LEAGUE_B, contents: 'b' },
          ],
          'manifest v2'
        )
      ).rejects.toThrow('disk full');

      await expect(database.readWrapper(LEAGUE_A)).resolves.toBe('a');
      await expect(database.readManifest()).resolves.toBe('manifest v1');
      expect((await readdir(folder)).sort()).toEqual([
        'manifest.json',
        `wrapper-${LEAGUE_A}.json`,
      ]);
    });

    it('rejects a wrapper UUID that is not a UUID v4, before it writes any file', async () => {
      const database = createDatabaseFolder(nodeFileSystem(), folder);
      await expect(
        database.save(
          [
            { uuid: LEAGUE_A, contents: 'a' },
            { uuid: '../evil', contents: 'x' },
          ],
          'manifest'
        )
      ).rejects.toThrow('A league file name needs a UUID v4. It got "../evil".');
      await expect(access(folder)).rejects.toThrow();
    });
  });
});
