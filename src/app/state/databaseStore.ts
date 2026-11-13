import { create } from 'zustand';
import { getNameKey } from '@/engine/identity';
import type {
  LeagueWrapper,
  SeasonSummary,
  SeasonWrapper,
  TeamBlueprint,
  WrapperSummary,
} from '@/domain';
import type { DatabaseFolder } from '@/persistence/types';
import { summarizeLeague } from './summarizeLeague';
import { summarizeSeason } from './summarizeSeason';

export type DatabaseStatus =
  { kind: 'closed' } | { kind: 'open' } | { kind: 'error'; message: string };

/**
 * The MVP2 database in memory (Task 108, Task 76). It holds the manifest
 * (installation UUID, Blueprints, one row for each league) and each league
 * the user opened, by UUID. An opened league stays here after the user
 * leaves its screen (`PERSISTENCE.md` §2b).
 *
 * The `saved*` fields are the snapshots of Task 76 c: the objects as they
 * were at the last open or save. An unsaved check compares by reference, as
 * MVP1 Task 26 does: the actions never change an object in place, so any
 * change builds a new object.
 *
 * `rows` are the rows as the manifest file holds them. The row of an opened
 * league comes from the league itself (`currentRows`). `seasonRows` and
 * `seasons` work the same way for the Seasons (`currentSeasonRows`, Task
 * 210). A Season row that `savedSeasonRows` has and `seasonRows` lacks is a
 * deleted Season: the next save removes its file.
 *
 * State only. The actions that change it live in `databaseActions.ts`.
 */
export interface DatabaseState {
  status: DatabaseStatus;
  folder: DatabaseFolder | null;
  installationUuid: string | null;
  blueprints: TeamBlueprint[];
  rows: WrapperSummary[];
  seasonRows: SeasonSummary[];
  leagues: Record<string, LeagueWrapper>;
  seasons: Record<string, SeasonWrapper>;
  savedBlueprints: TeamBlueprint[];
  savedRows: WrapperSummary[];
  savedSeasonRows: SeasonSummary[];
  savedLeagues: Record<string, LeagueWrapper>;
  savedSeasons: Record<string, SeasonWrapper>;
}

const NO_BLUEPRINTS: TeamBlueprint[] = [];
const NO_ROWS: WrapperSummary[] = [];
const NO_SEASON_ROWS: SeasonSummary[] = [];

export const useDatabaseStore = create<DatabaseState>()(() => ({
  status: { kind: 'closed' },
  folder: null,
  installationUuid: null,
  blueprints: NO_BLUEPRINTS,
  rows: NO_ROWS,
  seasonRows: NO_SEASON_ROWS,
  leagues: {},
  seasons: {},
  savedBlueprints: NO_BLUEPRINTS,
  savedRows: NO_ROWS,
  savedSeasonRows: NO_SEASON_ROWS,
  savedLeagues: {},
  savedSeasons: {},
}));

/** The folder and the installation UUID of an open database. Each action
 * calls it first, so an action on a closed database throws. */
export function requireOpenDatabase(state: DatabaseState): {
  folder: DatabaseFolder;
  installationUuid: string;
} {
  if (
    state.status.kind !== 'open' ||
    state.folder === null ||
    state.installationUuid === null
  ) {
    throw new Error('The database is not open.');
  }
  return { folder: state.folder, installationUuid: state.installationUuid };
}

/** The manifest rows as they are now: the row of each opened league comes
 * from the league, and a new league adds its row at the end. */
export function currentRows(
  state: Pick<DatabaseState, 'rows' | 'leagues'>
): WrapperSummary[] {
  const known = new Set(state.rows.map((row) => row.uuid));
  const rows = state.rows.map((row) => {
    const opened = state.leagues[row.uuid];
    return opened ? summarizeLeague(opened) : row;
  });
  const added = Object.values(state.leagues)
    .filter((wrapper) => !known.has(wrapper.uuid))
    .map(summarizeLeague);
  return [...rows, ...added];
}

/** The Season rows as the next save writes them: each row from its open
 * Season, then the new Seasons, which have no row yet (Task 210). */
export function currentSeasonRows(
  state: Pick<DatabaseState, 'seasonRows' | 'seasons'>
): SeasonSummary[] {
  const known = new Set(state.seasonRows.map((row) => row.uuid));
  const rows = state.seasonRows.map((row) => {
    const opened = state.seasons[row.uuid];
    return opened ? summarizeSeason(opened) : row;
  });
  const added = Object.values(state.seasons)
    .filter((wrapper) => !known.has(wrapper.uuid))
    .map(summarizeSeason);
  return [...rows, ...added];
}

/** The Seasons of the last save that the user deleted since: the next
 * save removes their files (Task 210 choice 6). */
export function findDeletedSeasonUuids(
  state: Pick<DatabaseState, 'seasonRows' | 'seasons' | 'savedSeasonRows'>
): string[] {
  const current = new Set(currentSeasonRows(state).map((row) => row.uuid));
  return state.savedSeasonRows
    .map((row) => row.uuid)
    .filter((uuid) => !current.has(uuid));
}

/** Two row lists with the same values. A row is a few small fields, so a
 * JSON compare is enough. */
function sameRows<Row>(a: readonly Row[], b: readonly Row[]): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

/** One key for a name and a year, which no name can fake: a NUL never
 * appears in a typed name. */
function getSeasonKey(name: string, year: string): string {
  return `${getNameKey(name)}\u0000${getNameKey(year)}`;
}

/** True when another Season has this name and year, in any case and with
 * no spaces at the two ends (US-13.1). A rename passes its own UUID, so a
 * Season never clashes with itself. */
export function isSeasonNameTaken(
  state: Pick<DatabaseState, 'seasonRows' | 'seasons'>,
  name: string,
  year: string,
  exceptUuid?: string
): boolean {
  const key = getSeasonKey(name, year);
  return currentSeasonRows(state).some(
    (row) => row.uuid !== exceptUuid && getSeasonKey(row.name, row.year) === key
  );
}

/** Throws for a finished Season: it is read only, until the user reopens it
 * (US-13.9). Each action that changes the content of a Season calls it. */
export function requireRunningSeason(wrapper: SeasonWrapper): void {
  if (wrapper.content.finished) {
    const { name, year } = wrapper.content;
    throw new RangeError(
      `The Season "${name}" (${year}) is finished. Reopen it to change it.`
    );
  }
}

/** True when the opened league is not the object last opened or saved. A
 * new league with no snapshot is unsaved. A league that is not open is
 * not unsaved. */
export function isLeagueUnsaved(
  state: Pick<DatabaseState, 'leagues' | 'savedLeagues'>,
  uuid: string
): boolean {
  const league = state.leagues[uuid];
  return league !== undefined && state.savedLeagues[uuid] !== league;
}

/** True for a Blueprint change only, not for a row change, so the Teams
 * screen marker shows only Blueprint edits (Task 76 edge case). */
export function areBlueprintsUnsaved(state: DatabaseState): boolean {
  return state.blueprints !== state.savedBlueprints;
}

/** True when the opened Season is not the object last opened or saved, as
 * for a league. */
export function isSeasonUnsaved(
  state: Pick<DatabaseState, 'seasons' | 'savedSeasons'>,
  uuid: string
): boolean {
  const season = state.seasons[uuid];
  return season !== undefined && state.savedSeasons[uuid] !== season;
}

/** True for a Blueprint change, a new or deleted league or Season, or a
 * changed row. */
export function isManifestUnsaved(state: DatabaseState): boolean {
  return (
    areBlueprintsUnsaved(state) ||
    !sameRows(currentRows(state), state.savedRows) ||
    !sameRows(currentSeasonRows(state), state.savedSeasonRows)
  );
}

/** The opened leagues with unsaved changes, in the order they were opened. */
export function unsavedLeagues(state: DatabaseState): LeagueWrapper[] {
  return Object.values(state.leagues).filter((wrapper) =>
    isLeagueUnsaved(state, wrapper.uuid)
  );
}

/** The opened Seasons with unsaved changes, in the order they were opened. */
export function unsavedSeasons(state: DatabaseState): SeasonWrapper[] {
  return Object.values(state.seasons).filter((wrapper) =>
    isSeasonUnsaved(state, wrapper.uuid)
  );
}

/** True when a save has something to write: a league, a Season, or the
 * manifest. */
export function isDatabaseUnsaved(state: DatabaseState): boolean {
  return (
    isManifestUnsaved(state) ||
    unsavedLeagues(state).length > 0 ||
    unsavedSeasons(state).length > 0
  );
}
