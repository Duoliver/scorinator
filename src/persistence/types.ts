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

/** What an adapter must implement to let the user pick a file path through
 * the OS's native dialog. Returns `null` when the user cancels. */
export interface SaveFileDialog {
  pickSavePath(defaultPath?: string): Promise<string | null>;
  pickOpenPath(): Promise<string | null>;
}
