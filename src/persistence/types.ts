import type { Tier } from '@/engine/tier-ovr';

/** What an adapter must implement to read and write plain text files. It
 * knows no league, team, or other record: it moves text only. Turning text
 * into a record is the job of a parser in `adapters/`. */
export interface FileSystem {
  readTextFile(path: string): Promise<string>;
  writeTextFile(path: string, contents: string): Promise<void>;
  rename(from: string, to: string): Promise<void>;
  remove(path: string): Promise<void>;
  exists(path: string): Promise<boolean>;
}

/** One team in a team-list file, CSV or JSON. Each team-list parser returns
 * this shape, so the app reads both formats the same way. `slug` and `colour`
 * are `''` when the file leaves them blank: the app fills in the slug from
 * the name. */
export interface TeamListRecord {
  slug: string;
  name: string;
  colour: string;
  tier: Tier;
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
  pickSavePath(
    defaultPath?: string,
    filters?: readonly FileFilter[]
  ): Promise<string | null>;
  pickOpenPath(filters?: readonly FileFilter[]): Promise<string | null>;
}
