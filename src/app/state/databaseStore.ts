import { create } from 'zustand';
import type { LeagueWrapper, TeamBlueprint, WrapperSummary } from '@/domain';
import type { DatabaseFolder } from '@/persistence/types';
import { summarizeLeague } from './summarizeLeague';

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
 * league comes from the league itself (`currentRows`).
 *
 * State only. The actions that change it live in `databaseActions.ts`.
 */
export interface DatabaseState {
  status: DatabaseStatus;
  folder: DatabaseFolder | null;
  installationUuid: string | null;
  blueprints: TeamBlueprint[];
  rows: WrapperSummary[];
  leagues: Record<string, LeagueWrapper>;
  savedBlueprints: TeamBlueprint[];
  savedRows: WrapperSummary[];
  savedLeagues: Record<string, LeagueWrapper>;
}

const NO_BLUEPRINTS: TeamBlueprint[] = [];
const NO_ROWS: WrapperSummary[] = [];

export const useDatabaseStore = create<DatabaseState>()(() => ({
  status: { kind: 'closed' },
  folder: null,
  installationUuid: null,
  blueprints: NO_BLUEPRINTS,
  rows: NO_ROWS,
  leagues: {},
  savedBlueprints: NO_BLUEPRINTS,
  savedRows: NO_ROWS,
  savedLeagues: {},
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

/** Two row lists with the same values. A row is a few small fields, so a
 * JSON compare is enough. */
function sameRows(a: readonly WrapperSummary[], b: readonly WrapperSummary[]): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
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

/** True for a Blueprint change, a new league, or a changed row. */
export function isManifestUnsaved(state: DatabaseState): boolean {
  return areBlueprintsUnsaved(state) || !sameRows(currentRows(state), state.savedRows);
}

/** The opened leagues with unsaved changes, in the order they were opened. */
export function unsavedLeagues(state: DatabaseState): LeagueWrapper[] {
  return Object.values(state.leagues).filter((wrapper) =>
    isLeagueUnsaved(state, wrapper.uuid)
  );
}

/** True when a save has something to write: a league or the manifest. */
export function isDatabaseUnsaved(state: DatabaseState): boolean {
  return isManifestUnsaved(state) || unsavedLeagues(state).length > 0;
}
