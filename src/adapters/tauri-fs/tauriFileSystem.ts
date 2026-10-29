import {
  exists,
  mkdir,
  readTextFile,
  remove,
  rename,
  writeTextFile,
} from '@tauri-apps/plugin-fs';
import type { FolderFileSystem } from '@/persistence/types';

/** `FolderFileSystem` backed by the real Tauri `fs` plugin. */
export const tauriFileSystem: FolderFileSystem = {
  readTextFile: (path) => readTextFile(path),
  writeTextFile: (path, contents) => writeTextFile(path, contents),
  rename: (from, to) => rename(from, to),
  remove: (path) => remove(path),
  exists: (path) => exists(path),
  mkdir: (path) => mkdir(path, { recursive: true }),
};
