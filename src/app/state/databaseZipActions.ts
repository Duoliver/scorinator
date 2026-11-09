import type {
  ImportChoice,
  ImportCounts,
  ImportStep,
  RandomBytes,
} from '@/engine/identity';
import type { LeagueWrapper, TeamBlueprint } from '@/domain';
import { cryptoRandomBytes } from '@/app/random';
import { parseLeagueWrapper } from '@/app/data/databaseFile';
import { packDatabase, readDatabaseZip } from '@/app/data/databaseZip';
import {
  importBlueprints,
  importLeagues,
  planBlueprintImport,
  planLeagueImport,
  type LeagueImportCounts,
} from './importActions';
import { currentRows, requireOpenDatabase, useDatabaseStore } from './databaseStore';

/**
 * "Export entire database" and "Import entire database" (US-10.4,
 * Task 146). The import merges with the rules of Task 144: it never
 * replaces the local database.
 */

/** The plan of a database import: the Blueprint steps and the league steps,
 * for one "Resolve conflicts" dialog (choice 5). */
export interface DatabaseImportPlan {
  blueprints: ImportStep<TeamBlueprint>[];
  leagues: ImportStep<LeagueWrapper>[];
}

/** The counts of a database import, for the message of Task 149. */
export interface DatabaseImportCounts {
  blueprints: ImportCounts;
  leagues: LeagueImportCounts;
}

/**
 * The bytes of the database `.zip`, from the live state: the Blueprints and
 * each league with its unsaved changes. A league that is not loaded comes
 * from its file, checked by the wrapper parser, and stays closed (choice 3).
 * A bad file rejects with the parser error.
 */
export async function exportDatabaseZip(): Promise<Uint8Array> {
  const state = useDatabaseStore.getState();
  const { installationUuid } = requireOpenDatabase(state);
  return packDatabase(
    { installationUuid, blueprints: state.blueprints, wrappers: currentRows(state) },
    await readAllLeagues()
  );
}

/** Every league from the live state, in the row order. A league that is not
 * loaded comes from its file and stays closed (choice 3). */
export async function readAllLeagues(): Promise<LeagueWrapper[]> {
  const state = useDatabaseStore.getState();
  const { folder } = requireOpenDatabase(state);
  return Promise.all(
    currentRows(state).map(
      async (row) =>
        state.leagues[row.uuid] ??
        parseLeagueWrapper(await folder.readWrapper(row.uuid))
    )
  );
}

/** Reads a database `.zip` and sorts its Blueprints and leagues. Rejects
 * for a `.zip` that is not a database, and changes nothing. */
export async function planDatabaseImport(
  bytes: Uint8Array
): Promise<DatabaseImportPlan> {
  const contents = readDatabaseZip(bytes);
  return {
    blueprints: planBlueprintImport(contents.blueprints),
    leagues: await planLeagueImport(contents.leagues),
  };
}

/**
 * Applies a database plan: the Blueprints first, then the leagues (choice
 * 5). The leagues add no embedded Blueprint, because the Blueprints of the
 * zip are entities of their own. `choices` holds the choice for each
 * conflict, by UUID, for both kinds.
 */
export function importDatabase(
  plan: DatabaseImportPlan,
  choices: ReadonlyMap<string, ImportChoice>,
  randomBytes: RandomBytes = cryptoRandomBytes
): DatabaseImportCounts {
  return {
    blueprints: importBlueprints(plan.blueprints, choices, randomBytes),
    leagues: importLeagues(plan.leagues, choices, [], randomBytes),
  };
}
