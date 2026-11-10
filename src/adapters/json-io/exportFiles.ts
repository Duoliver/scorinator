import { isMvp1File } from './mvp1';
import {
  checkUnique,
  failFor,
  isRecord,
  readBlueprint,
  readFileHeader,
  readList,
  readWrapperBody,
  type Fail,
} from './database';
import {
  DATABASE_FORMAT_VERSION,
  type SavedBlueprint,
  type SavedBlueprintFile,
  SavedFileKind,
  type SavedLeagueEntry,
  type SavedLeagueFile,
} from './types';

/**
 * The JSON format of the two export files of the File module (Task 145):
 * the league file (US-10.1, US-10.2) and the Blueprint file (US-10.2). They
 * use the format version and the readers of the database files (choice 2).
 * Each parser checks the shape, the kind, the version, and that no UUID
 * shows twice. It does not check that a snapshot is named by a league: the
 * import skips a snapshot that no added league names (Task 144 choice 6).
 */

const failLeagueFile: Fail = failFor('A league file');
const failBlueprintFile: Fail = failFor('A team blueprints file');
const LEAGUE_FILE_PREFIX = 'A league file is not valid: ';

/** What `detectFileKind` finds. `mvp1` is an MVP1 league save file or teams
 * JSON. `unknown` is any other text: the parser of the import then says what
 * is wrong with it. */
export type DetectedFileKind = SavedFileKind | 'mvp1' | 'unknown';

const KINDS: readonly SavedFileKind[] = Object.values(SavedFileKind);

/** Finds the kind of a file before the import reads it, so a wrong file can
 * name the right import button (US-10.3, choice 4). */
export function detectFileKind(text: string): DetectedFileKind {
  if (isMvp1File(text)) return 'mvp1';
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return 'unknown';
  }
  if (!isRecord(raw)) return 'unknown';
  const kind = KINDS.find((known) => known === raw.kind);
  return kind ?? 'unknown';
}

function readBlueprints(value: unknown, fail: Fail): SavedBlueprint[] {
  const blueprints = readList(value, 'blueprints', fail).map((item, index) =>
    readBlueprint(item, index, fail)
  );
  checkUnique(
    blueprints,
    (b) => b.uuid,
    (i, first) => `Blueprint ${i + 1} has the same UUID as Blueprint ${first + 1}.`,
    fail
  );
  return blueprints;
}

export function serializeLeagueFile(file: SavedLeagueFile): string {
  return JSON.stringify(file, null, 2);
}

/** Parses and checks a league file. Throws an `Error` that starts with
 * `A league file is not valid:`. With many leagues, an error inside one
 * league names it, for example "league 2: team 1 has no valid OVR." */
export function parseLeagueFile(text: string): SavedLeagueFile {
  const fail: Fail = failLeagueFile;
  const { raw, version } = readFileHeader(text, SavedFileKind.LEAGUES, fail);
  const items = readList(raw.leagues, 'leagues', fail);
  if (items.length === 0) fail('the file has no league.');

  const leagues = items.map((item, index): SavedLeagueEntry => {
    if (!isRecord(item)) fail(`league ${index + 1} is not an object.`);
    try {
      return readWrapperBody(item, version);
    } catch (error) {
      if (items.length === 1 || !(error instanceof Error)) throw error;
      const message = error.message.startsWith(LEAGUE_FILE_PREFIX)
        ? error.message.slice(LEAGUE_FILE_PREFIX.length)
        : error.message;
      return fail(`league ${index + 1}: ${message}`);
    }
  });
  checkUnique(
    leagues,
    (league) => league.uuid,
    (i, first) => `league ${i + 1} has the same UUID as league ${first + 1}.`,
    fail
  );

  return {
    kind: SavedFileKind.LEAGUES,
    formatVersion: DATABASE_FORMAT_VERSION,
    leagues,
    blueprints: readBlueprints(raw.blueprints, fail),
  };
}

export function serializeBlueprintFile(file: SavedBlueprintFile): string {
  return JSON.stringify(file, null, 2);
}

/** Parses and checks a Blueprint file. Throws an `Error` that starts with
 * `A team blueprints file is not valid:`. */
export function parseBlueprintFile(text: string): SavedBlueprintFile {
  const fail: Fail = failBlueprintFile;
  const { raw } = readFileHeader(text, SavedFileKind.BLUEPRINTS, fail);
  const blueprints = readBlueprints(raw.blueprints, fail);
  if (blueprints.length === 0) fail('the file has no Blueprint.');
  return {
    kind: SavedFileKind.BLUEPRINTS,
    formatVersion: DATABASE_FORMAT_VERSION,
    blueprints,
  };
}
