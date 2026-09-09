/** What an adapter must implement to read/write plain text files. No
 * "League" or other domain concept here — this is the generic file
 * contract; `adapters/json-io` owns turning text into a save file's shape. */
export interface FileSystem {
  readTextFile(path: string): Promise<string>;
  writeTextFile(path: string, contents: string): Promise<void>;
  rename(from: string, to: string): Promise<void>;
  remove(path: string): Promise<void>;
  exists(path: string): Promise<boolean>;
}

/** One entry in a native file dialog's type filter, e.g.
 * `{ name: 'Team CSV', extensions: ['csv'] }`. */
export interface FileFilter {
  name: string;
  extensions: string[];
}

/** What an adapter must implement to let the user pick a file path through
 * the OS's native dialog. Returns `null` when the user cancels. `filters`
 * restricts which files the dialog shows/allows; each adapter picks its own
 * default when the caller omits it. */
export interface SaveFileDialog {
  pickSavePath(defaultPath?: string, filters?: readonly FileFilter[]): Promise<string | null>;
  pickOpenPath(filters?: readonly FileFilter[]): Promise<string | null>;
}
