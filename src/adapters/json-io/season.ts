import { getNameKey, isUuidV4 } from '@/engine/identity';
import {
  checkUnique,
  failFor,
  isNonBlankString,
  isRecord,
  readFileHeader,
  readInstance,
  readLeague,
  readList,
  readProvenance,
  readTieOutcome,
  readTieRules,
  type Fail,
  type Raw,
  type Version,
} from './database';
import {
  DATABASE_FORMAT_VERSION,
  SavedFileKind,
  type SavedPlayoff,
  type SavedSeason,
  type SavedSeasonFile,
  type SavedSeasonLeague,
  type SavedWrapperLeague,
} from './types';

/**
 * The JSON format of a Season wrapper file (Task 209): the roster as its
 * Instances, and the Season with its leagues and playoffs. Each parser
 * check names the part that is wrong, after the prefix
 * `A Season file is not valid:`.
 */

const failSeason: Fail = failFor('A Season file');

/** The prefix of a league file error, which a Season league replaces with
 * its own place in the Season. */
const LEAGUE_ERROR = 'A league file is not valid: ';

/** Reads one league of the Season. Its teams are in the roster, once each.
 * The league checks of a league file run on its own teams only, so a
 * fixture cannot name a roster team that is not in the league. */
function readSeasonLeague(
  value: unknown,
  index: number,
  roster: ReadonlySet<string>,
  version: Version
): SavedSeasonLeague {
  const label = `league ${index + 1}`;
  if (!isRecord(value)) failSeason(`${label} is not an object.`);
  const teamUuids = readList(value.teamUuids, 'teamUuids', failSeason);
  if (
    !teamUuids.every(
      (uuid): uuid is string => typeof uuid === 'string' && roster.has(uuid)
    )
  ) {
    failSeason(`${label} has a team that is not in the Season roster.`);
  }
  checkUnique(
    teamUuids,
    (uuid) => uuid,
    () => `${label} has a team twice.`,
    failSeason
  );

  let league: SavedWrapperLeague;
  try {
    league = readLeague(value, new Set(teamUuids), version);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return failSeason(`${label}: ${message.replace(LEAGUE_ERROR, '')}`);
  }
  return { ...league, teamUuids };
}

function readPlayoff(
  value: unknown,
  index: number,
  roster: ReadonlySet<string>
): SavedPlayoff {
  const label = `playoff ${index + 1}`;
  if (!isRecord(value)) failSeason(`${label} is not an object.`);
  if (!isUuidV4(value.uuid)) failSeason(`${label} has no valid UUID.`);
  if (!isNonBlankString(value.name)) failSeason(`${label} has no name.`);
  const isRosterTeam = (id: unknown): id is string =>
    typeof id === 'string' && roster.has(id);
  if (!isRosterTeam(value.homeUuid) || !isRosterTeam(value.awayUuid)) {
    failSeason(`${label} has a team that is not in the Season roster.`);
  }
  if (value.homeUuid === value.awayUuid) {
    failSeason(`${label} has the same team at home and away.`);
  }
  const rules = readTieRules(value.rules, label, failSeason);
  const playoff: SavedPlayoff = {
    uuid: value.uuid,
    name: value.name,
    homeUuid: value.homeUuid,
    awayUuid: value.awayUuid,
    rules,
  };
  if (value.result === undefined) return playoff;
  if (!isRecord(value.result)) failSeason(`${label} result is not an object.`);
  const teams = new Set([value.homeUuid, value.awayUuid]);
  return {
    ...playoff,
    result: readTieOutcome(
      value.result,
      `${label} result`,
      teams,
      'a team of the playoff',
      failSeason
    ),
  };
}

function readSeason(
  value: unknown,
  roster: ReadonlySet<string>,
  version: Version
): SavedSeason {
  const label = 'the Season';
  if (!isRecord(value))
    failSeason('the "content" section is missing or not an object.');
  if (!isUuidV4(value.uuid)) failSeason(`${label} has no valid UUID.`);
  if (!isNonBlankString(value.name)) failSeason(`${label} has no name.`);
  if (!isNonBlankString(value.year)) failSeason(`${label} has no year.`);
  if (typeof value.finished !== 'boolean') {
    failSeason(`${label} has no valid "finished" flag.`);
  }
  const provenance = readProvenance(value, label, failSeason);

  const leagues = readList(value.leagues, 'leagues', failSeason).map((league, index) =>
    readSeasonLeague(league, index, roster, version)
  );
  checkUnique(
    leagues,
    (league) => league.uuid,
    (i, first) => `league ${i + 1} has the same UUID as league ${first + 1}.`,
    failSeason
  );

  const playoffs = readList(value.playoffs, 'playoffs', failSeason).map(
    (playoff, index) => readPlayoff(playoff, index, roster)
  );
  checkUnique(
    playoffs,
    (playoff) => playoff.uuid,
    (i, first) => `playoff ${i + 1} has the same UUID as playoff ${first + 1}.`,
    failSeason
  );
  checkUnique(
    playoffs,
    (playoff) => getNameKey(playoff.name),
    (i, first) => `playoff ${i + 1} has the same name as playoff ${first + 1}.`,
    failSeason
  );

  return {
    uuid: value.uuid,
    name: value.name,
    year: value.year,
    finished: value.finished,
    ...provenance,
    leagues,
    playoffs,
  };
}

export function serializeSeasonFile(file: SavedSeasonFile): string {
  return JSON.stringify(file, null, 2);
}

/** Parses and checks one Season wrapper file. Throws an `Error` that starts
 * with `A Season file is not valid:` and says what is wrong. */
export function parseSeasonFile(text: string): SavedSeasonFile {
  const { raw, version } = readFileHeader(text, SavedFileKind.SEASON, failSeason);
  return {
    kind: SavedFileKind.SEASON,
    formatVersion: DATABASE_FORMAT_VERSION,
    ...readSeasonBody(raw, version),
  };
}

function readSeasonBody(
  raw: Raw,
  version: Version
): Omit<SavedSeasonFile, 'kind' | 'formatVersion'> {
  if (!isUuidV4(raw.uuid)) failSeason('the file has no valid UUID.');
  const teams = readList(raw.teams, 'teams', failSeason).map((team, index) =>
    readInstance(team, index, failSeason)
  );
  checkUnique(
    teams,
    (team) => team.blueprintUuid,
    (i, first) => `team ${i + 1} has the same Blueprint UUID as team ${first + 1}.`,
    failSeason
  );
  const content = readSeason(
    raw.content,
    new Set(teams.map((team) => team.blueprintUuid)),
    version
  );
  if (content.uuid !== raw.uuid) failSeason('the file UUID is not the Season UUID.');
  return { uuid: raw.uuid, teams, content };
}
