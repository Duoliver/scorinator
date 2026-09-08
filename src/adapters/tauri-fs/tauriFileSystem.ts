import {
  exists,
  readTextFile,
  remove,
  rename,
  writeTextFile,
} from '@tauri-apps/plugin-fs';
import type { FileSystem } from '../../persistence/types';

/** `FileSystem` backed by the real Tauri `fs` plugin. */
export const tauriFileSystem: FileSystem = {
  readTextFile: (path) => readTextFile(path),
  writeTextFile: (path, contents) => writeTextFile(path, contents),
  rename: (from, to) => rename(from, to),
  remove: (path) => remove(path),
  exists: (path) => exists(path),
};
