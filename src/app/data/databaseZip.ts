import { packDatabaseZip, unpackDatabaseZip } from '@/adapters/json-io';
import { tauriDialog, tauriFileSystem } from '@/adapters/tauri-fs';
import type { LeagueWrapper, Manifest, SeasonWrapper, TeamBlueprint } from '@/domain';
import type { FileFilter, FileSystem, SaveFileDialog } from '@/persistence/types';
import {
  parseLeagueWrapper,
  parseManifestRecord,
  parseSeasonWrapper,
  serializeLeagueWrapper,
  serializeManifestRecord,
  serializeSeasonWrapper,
} from './databaseFile';
import { getLocalDate } from './localDate';

/**
 * The map between the domain records and the database `.zip` (US-10.4,
 * Task 146). The zip holds the same files as the database folder, so each
 * file uses the database parser and writer.
 */

const ZIP_FILTERS: readonly FileFilter[] = [
  { name: 'Database file', extensions: ['zip'] },
];

/** The Blueprints, the leagues, and the Seasons of a database `.zip`. The
 * database import takes the Seasons from Task 247 on (Task 209 choice 7). */
export interface DatabaseZipContents {
  blueprints: TeamBlueprint[];
  leagues: LeagueWrapper[];
  seasons: SeasonWrapper[];
}

export function packDatabase(
  manifest: Manifest,
  leagues: readonly LeagueWrapper[],
  seasons: readonly SeasonWrapper[]
): Uint8Array {
  return packDatabaseZip({
    manifest: serializeManifestRecord(manifest),
    wrappers: leagues.map((league) => ({
      uuid: league.uuid,
      contents: serializeLeagueWrapper(league),
    })),
    seasons: seasons.map((season) => ({
      uuid: season.uuid,
      contents: serializeSeasonWrapper(season),
    })),
  });
}

/** Reads a database `.zip`. Throws an `Error` that starts with "This .zip
 * file is not a Scorinator database:". The installation UUID and the rows
 * of its manifest do not count: the import makes its own rows. */
export function readDatabaseZip(bytes: Uint8Array): DatabaseZipContents {
  const bundle = unpackDatabaseZip(bytes);
  try {
    return {
      blueprints: parseManifestRecord(bundle.manifest).blueprints,
      leagues: bundle.wrappers.map((wrapper) => parseLeagueWrapper(wrapper.contents)),
      seasons: bundle.seasons.map((season) => parseSeasonWrapper(season.contents)),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`This .zip file is not a Scorinator database: ${message}`);
  }
}

/** Asks where to write the database `.zip`, and writes it. The default name
 * has the date (US-10.4). Returns the path, or `null` on Cancel. */
export async function saveDatabaseZipFile(
  bytes: Uint8Array,
  today: Date = new Date(),
  fs: FileSystem = tauriFileSystem,
  dialog: SaveFileDialog = tauriDialog
): Promise<string | null> {
  const name = `scorinator-database-${getLocalDate(today)}.zip`;
  const path = await dialog.pickSavePath(name, ZIP_FILTERS);
  if (path === null) return null;
  await fs.writeBinaryFile(path, bytes);
  return path;
}

/** The bytes of the `.zip` the user picks, or `null` on Cancel. */
export async function openDatabaseZipFile(
  fs: FileSystem = tauriFileSystem,
  dialog: SaveFileDialog = tauriDialog
): Promise<Uint8Array | null> {
  const path = await dialog.pickOpenPath(ZIP_FILTERS);
  return path === null ? null : fs.readBinaryFile(path);
}
