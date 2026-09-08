import {
  access,
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
import { writeTextFileAtomic } from './atomicWrite';
import type { FileSystem } from '../../persistence/types';

/** A `FileSystem` backed by real Node `fs` calls against a real temp
 * directory, so `writeTextFileAtomic`'s crash-safety claims get checked
 * against real disk behavior rather than a mock that just records calls. */
function nodeFileSystem(): FileSystem {
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
  };
}

describe('writeTextFileAtomic', () => {
  let dir: string;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'scorinator-atomic-write-'));
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it('writes the given contents to a new file', async () => {
    const targetPath = join(dir, 'save.json');
    await writeTextFileAtomic(nodeFileSystem(), targetPath, '{"a":1}');

    await expect(readFile(targetPath, 'utf-8')).resolves.toBe('{"a":1}');
  });

  it('overwrites an existing file cleanly', async () => {
    const targetPath = join(dir, 'save.json');
    await writeFile(targetPath, 'old contents', 'utf-8');

    await writeTextFileAtomic(nodeFileSystem(), targetPath, 'new contents');

    await expect(readFile(targetPath, 'utf-8')).resolves.toBe('new contents');
  });

  it('leaves no temp file behind after a successful write', async () => {
    const targetPath = join(dir, 'save.json');
    await writeTextFileAtomic(nodeFileSystem(), targetPath, 'contents');

    const entries = await readdir(dir);
    expect(entries).toEqual(['save.json']);
  });

  it('leaves the original file untouched and cleans up the temp file when the rename fails', async () => {
    const targetPath = join(dir, 'save.json');
    await writeFile(targetPath, 'original', 'utf-8');

    const flaky: FileSystem = {
      ...nodeFileSystem(),
      rename: async () => {
        throw new Error('rename boom');
      },
    };

    await expect(
      writeTextFileAtomic(flaky, targetPath, 'new contents')
    ).rejects.toThrow('rename boom');

    await expect(readFile(targetPath, 'utf-8')).resolves.toBe('original');
    const entries = await readdir(dir);
    expect(entries).toEqual(['save.json']);
  });
});
