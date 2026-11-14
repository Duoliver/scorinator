import { strFromU8, strToU8, unzipSync, zipSync, type Zippable } from 'fflate';
import type { WrapperText } from '@/persistence/types';
import { parseManifest } from './database';

/**
 * The `.zip` of "Export entire database" (US-10.4, Task 146): the
 * `manifest.json` and one `wrapper-{uuid}.json` for each league, with the
 * names of the database folder (Task 76). The zip moves text only. The
 * caller parses each wrapper text, as it does for a file of the folder.
 */

/** The text files of one database. */
export interface DatabaseBundle {
  manifest: string;
  wrappers: WrapperText[];
  seasons: WrapperText[];
}

const MANIFEST = 'manifest.json';
const wrapperName = (uuid: string): string => `wrapper-${uuid}.json`;

function fail(message: string): never {
  throw new Error(`This .zip file is not a Scorinator database: ${message}`);
}

export function packDatabaseZip(bundle: DatabaseBundle): Uint8Array {
  const files: Zippable = { [MANIFEST]: strToU8(bundle.manifest) };
  for (const wrapper of [...bundle.wrappers, ...bundle.seasons]) {
    files[wrapperName(wrapper.uuid)] = strToU8(wrapper.contents);
  }
  return zipSync(files);
}

/**
 * Reads a database `.zip` (choice 4). It must hold `manifest.json`, a valid
 * manifest, and a wrapper file for each manifest row, and no other file. A
 * folder entry does not count. The wrappers come in the manifest order.
 * Throws an `Error` that starts with "This .zip file is not a Scorinator
 * database:".
 */
export function unpackDatabaseZip(bytes: Uint8Array): DatabaseBundle {
  let entries: Record<string, Uint8Array>;
  try {
    entries = unzipSync(bytes);
  } catch {
    return fail('the file is not a zip file.');
  }
  const files = new Map(
    Object.entries(entries).filter(([name]) => !name.endsWith('/'))
  );

  const manifestBytes = files.get(MANIFEST);
  if (manifestBytes === undefined) fail(`it has no ${MANIFEST}.`);
  const manifest = strFromU8(manifestBytes);
  let rows: { uuid: string; name: string }[];
  let seasonRows: { uuid: string; name: string }[];
  try {
    ({ wrappers: rows, seasons: seasonRows } = parseManifest(manifest));
  } catch (error) {
    return fail(error instanceof Error ? error.message : String(error));
  }

  const readFile = (row: { uuid: string; name: string }, noun: string): WrapperText => {
    const contents = files.get(wrapperName(row.uuid));
    if (contents === undefined) fail(`it has no file for the ${noun} "${row.name}".`);
    return { uuid: row.uuid, contents: strFromU8(contents) };
  };
  const wrappers = rows.map((row) => readFile(row, 'league'));
  const seasons = seasonRows.map((row) => readFile(row, 'Season'));

  const known = new Set([
    MANIFEST,
    ...[...rows, ...seasonRows].map((row) => wrapperName(row.uuid)),
  ]);
  const other = [...files.keys()].find((name) => !known.has(name));
  if (other !== undefined)
    fail(`it has a file that a database does not have: "${other}".`);

  return { manifest, wrappers, seasons };
}
