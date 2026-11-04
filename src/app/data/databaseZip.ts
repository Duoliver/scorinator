import { packDatabaseZip, unpackDatabaseZip } from '@/adapters/json-io';
import type { LeagueWrapper, Manifest, TeamBlueprint } from '@/domain';
import {
  parseLeagueWrapper,
  parseManifestRecord,
  serializeLeagueWrapper,
  serializeManifestRecord,
} from './databaseFile';

/**
 * The map between the domain records and the database `.zip` (US-10.4,
 * Task 146). The zip holds the same files as the database folder, so each
 * file uses the database parser and writer.
 */

/** The Blueprints and the leagues of a database `.zip`. */
export interface DatabaseZipContents {
  blueprints: TeamBlueprint[];
  leagues: LeagueWrapper[];
}

export function packDatabase(
  manifest: Manifest,
  leagues: readonly LeagueWrapper[]
): Uint8Array {
  return packDatabaseZip({
    manifest: serializeManifestRecord(manifest),
    wrappers: leagues.map((league) => ({
      uuid: league.uuid,
      contents: serializeLeagueWrapper(league),
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
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`This .zip file is not a Scorinator database: ${message}`);
  }
}
