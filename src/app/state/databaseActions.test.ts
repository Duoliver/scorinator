import { beforeEach, describe, expect, it } from 'vitest';
import type { Manifest } from '@/domain';
import { isUuidV4 } from '@/engine/identity';
import {
  blueprint,
  HARBORVIEW,
  INSTALLATION,
  LEAGUE,
  leagueWrapper,
  memoryFolder,
  OTHER_LEAGUE,
  result,
  SALT_MARSH,
} from '@/test/databaseRecords';
import {
  parseLeagueWrapper,
  parseManifestRecord,
  serializeLeagueWrapper,
  serializeManifestRecord,
} from '@/app/data/databaseFile';
import { openDatabase, openLeague, saveDatabase } from './databaseActions';
import {
  areBlueprintsUnsaved,
  currentRows,
  isLeagueUnsaved,
  isManifestUnsaved,
  useDatabaseStore,
  type DatabaseState,
} from './databaseStore';
import { summarizeLeague } from './summarizeLeague';

const state = (): DatabaseState => useDatabaseStore.getState();

function savedManifest(overrides: Partial<Manifest> = {}): string {
  return serializeManifestRecord({
    installationUuid: INSTALLATION,
    blueprints: [blueprint()],
    wrappers: [summarizeLeague(leagueWrapper())],
    ...overrides,
  });
}

/** A database with one saved league, opened in the store. */
async function openWithLeague(): Promise<ReturnType<typeof memoryFolder>> {
  const memory = memoryFolder({
    manifest: savedManifest(),
    wrappers: { [LEAGUE]: serializeLeagueWrapper(leagueWrapper()) },
  });
  await openDatabase(memory.folder);
  await openLeague(LEAGUE);
  return memory;
}

/** The change a scorination makes: a new wrapper object with one more result. */
function scorinateFirstMatch(): void {
  const wrapper = state().leagues[LEAGUE];
  const phase = wrapper.content.phases[0];
  const played = {
    ...wrapper,
    content: {
      ...wrapper.content,
      phases: [
        {
          ...phase,
          results: [...phase.results, result('p1.g1.md1.m1', SALT_MARSH, HARBORVIEW)],
        },
      ],
    },
  };
  useDatabaseStore.setState((s) => ({ leagues: { ...s.leagues, [LEAGUE]: played } }));
}

beforeEach(() => {
  useDatabaseStore.setState(useDatabaseStore.getInitialState(), true);
});

describe('openDatabase (Task 76, US-11.1)', () => {
  it('at the first start, makes the installation UUID and saves an empty manifest at once', async () => {
    const memory = memoryFolder();
    const bytes = (length: number): Uint8Array => new Uint8Array(length).fill(7);
    await openDatabase(memory.folder, bytes);

    expect(state().status).toEqual({ kind: 'open' });
    expect(state().installationUuid).toBe('07070707-0707-4707-8707-070707070707');
    expect(memory.saves).toHaveLength(1);
    expect(memory.saves[0].wrappers).toEqual([]);
    expect(parseManifestRecord(memory.files.manifest ?? '')).toEqual({
      installationUuid: '07070707-0707-4707-8707-070707070707',
      blueprints: [],
      wrappers: [],
    });
    expect(isManifestUnsaved(state())).toBe(false);
  });

  it('makes a real UUID v4 with the default random source', async () => {
    await openDatabase(memoryFolder().folder);
    expect(isUuidV4(state().installationUuid)).toBe(true);
  });

  it('keeps the installation UUID of a saved manifest, and writes nothing', async () => {
    const memory = memoryFolder({ manifest: savedManifest() });
    await openDatabase(memory.folder);

    expect(state().installationUuid).toBe(INSTALLATION);
    expect(state().blueprints).toEqual([blueprint()]);
    expect(state().rows).toEqual([summarizeLeague(leagueWrapper())]);
    expect(state().leagues).toEqual({});
    expect(memory.saves).toEqual([]);
  });

  it('starts with nothing unsaved', async () => {
    await openDatabase(memoryFolder({ manifest: savedManifest() }).folder);
    expect(areBlueprintsUnsaved(state())).toBe(false);
    expect(isManifestUnsaved(state())).toBe(false);
  });

  it('gives the error status with the parser message for a bad manifest, and loads nothing', async () => {
    await openDatabase(memoryFolder({ manifest: '{ nope' }).folder);
    expect(state().status).toEqual({
      kind: 'error',
      message: 'manifest.json is not valid: the text is not JSON.',
    });
    expect(state().blueprints).toEqual([]);
    expect(state().folder).toBeNull();
  });

  it('gives the error status when the folder cannot be read', async () => {
    const { folder } = memoryFolder();
    await openDatabase({
      ...folder,
      readManifest: async () => {
        throw new Error('permission denied');
      },
    });
    expect(state().status).toEqual({ kind: 'error', message: 'permission denied' });
  });
});

describe('openLeague', () => {
  it('reads, parses, and keeps the league, with a saved snapshot', async () => {
    await openWithLeague();
    expect(state().leagues[LEAGUE]).toEqual(leagueWrapper());
    expect(isLeagueUnsaved(state(), LEAGUE)).toBe(false);
  });

  it('gives the league from memory when it is open, with its unsaved changes', async () => {
    const memory = await openWithLeague();
    scorinateFirstMatch();
    const changed = state().leagues[LEAGUE];
    memory.files.wrappers[LEAGUE] = 'not read again';

    await expect(openLeague(LEAGUE)).resolves.toBe(changed);
    expect(isLeagueUnsaved(state(), LEAGUE)).toBe(true);
  });

  it('rejects with the message for a missing file', async () => {
    await openDatabase(memoryFolder({ manifest: savedManifest() }).folder);
    await expect(openLeague(LEAGUE)).rejects.toThrow(
      `The database has no file for the league ${LEAGUE}.`
    );
    expect(state().leagues).toEqual({});
  });

  it('rejects with the parser message for a bad file', async () => {
    const memory = memoryFolder({
      manifest: savedManifest(),
      wrappers: { [LEAGUE]: '[]' },
    });
    await openDatabase(memory.folder);
    await expect(openLeague(LEAGUE)).rejects.toThrow('A league file is not valid:');
  });

  it('rejects when the database is not open', async () => {
    await expect(openLeague(LEAGUE)).rejects.toThrow('The database is not open.');
  });

  it('makes the manifest unsaved when the saved row is one save behind (Task 76 crash case)', async () => {
    // The wrapper on disk has a result, but the manifest row was not written.
    const played = leagueWrapper([result('p1.g1.md1.m1', SALT_MARSH, HARBORVIEW)]);
    const memory = memoryFolder({
      manifest: savedManifest(),
      wrappers: { [LEAGUE]: serializeLeagueWrapper(played) },
    });
    await openDatabase(memory.folder);
    expect(isManifestUnsaved(state())).toBe(false);

    await openLeague(LEAGUE);
    expect(currentRows(state())).toEqual([summarizeLeague(played)]);
    expect(isManifestUnsaved(state())).toBe(true);
    expect(areBlueprintsUnsaved(state())).toBe(false);
  });
});

describe('the unsaved checks (Task 76 c)', () => {
  it('a scorination makes the league and the manifest unsaved, but not the Blueprints', async () => {
    await openWithLeague();
    scorinateFirstMatch();

    expect(isLeagueUnsaved(state(), LEAGUE)).toBe(true);
    expect(isManifestUnsaved(state())).toBe(true);
    expect(areBlueprintsUnsaved(state())).toBe(false);
  });

  it('a Blueprint change makes the Blueprints and the manifest unsaved', async () => {
    await openWithLeague();
    useDatabaseStore.setState({ blueprints: [blueprint({ name: 'Salt Marsh FC' })] });

    expect(areBlueprintsUnsaved(state())).toBe(true);
    expect(isManifestUnsaved(state())).toBe(true);
    expect(isLeagueUnsaved(state(), LEAGUE)).toBe(false);
  });

  it('a new league with no snapshot is unsaved, and adds a row', async () => {
    await openDatabase(memoryFolder({ manifest: savedManifest() }).folder);
    const added = leagueWrapper([], OTHER_LEAGUE);
    useDatabaseStore.setState((s) => ({
      leagues: { ...s.leagues, [OTHER_LEAGUE]: added },
    }));

    expect(isLeagueUnsaved(state(), OTHER_LEAGUE)).toBe(true);
    expect(currentRows(state()).map((row) => row.uuid)).toEqual([LEAGUE, OTHER_LEAGUE]);
    expect(isManifestUnsaved(state())).toBe(true);
  });

  it('a league that is not open is not unsaved', async () => {
    await openDatabase(memoryFolder({ manifest: savedManifest() }).folder);
    expect(isLeagueUnsaved(state(), LEAGUE)).toBe(false);
  });
});

describe('saveDatabase (Task 76 b)', () => {
  it('writes each unsaved wrapper and the manifest in one save call', async () => {
    const memory = await openWithLeague();
    scorinateFirstMatch();
    const scorinated = state().leagues[LEAGUE];
    await saveDatabase();

    expect(memory.saves).toHaveLength(1);
    expect(memory.saves[0].wrappers.map((w) => w.uuid)).toEqual([LEAGUE]);
    expect(parseLeagueWrapper(memory.files.wrappers[LEAGUE])).toEqual(scorinated);
    expect(parseManifestRecord(memory.files.manifest ?? '').wrappers).toEqual([
      summarizeLeague(scorinated),
    ]);
  });

  it('marks everything saved after the write', async () => {
    await openWithLeague();
    scorinateFirstMatch();
    useDatabaseStore.setState({ blueprints: [blueprint({ name: 'Salt Marsh FC' })] });
    await saveDatabase();

    expect(isLeagueUnsaved(state(), LEAGUE)).toBe(false);
    expect(areBlueprintsUnsaved(state())).toBe(false);
    expect(isManifestUnsaved(state())).toBe(false);
  });

  it('writes the manifest only, for a Blueprint change', async () => {
    const memory = await openWithLeague();
    useDatabaseStore.setState({ blueprints: [blueprint({ name: 'Salt Marsh FC' })] });
    await saveDatabase();

    expect(memory.saves[0].wrappers).toEqual([]);
    expect(parseManifestRecord(memory.files.manifest ?? '').blueprints[0].name).toBe(
      'Salt Marsh FC'
    );
  });

  it('keeps the rows of the leagues that are not open', async () => {
    const other = summarizeLeague(leagueWrapper([], OTHER_LEAGUE));
    const memory = memoryFolder({
      manifest: savedManifest({ wrappers: [summarizeLeague(leagueWrapper()), other] }),
      wrappers: { [LEAGUE]: serializeLeagueWrapper(leagueWrapper()) },
    });
    await openDatabase(memory.folder);
    await openLeague(LEAGUE);
    scorinateFirstMatch();
    await saveDatabase();

    const rows = parseManifestRecord(memory.files.manifest ?? '').wrappers;
    expect(rows.map((row) => row.uuid)).toEqual([LEAGUE, OTHER_LEAGUE]);
    expect(rows[1]).toEqual(other);
  });

  it('writes nothing when nothing is unsaved', async () => {
    const memory = await openWithLeague();
    await saveDatabase();
    expect(memory.saves).toEqual([]);
  });

  it('keeps a change made during the write unsaved', async () => {
    const memory = await openWithLeague();
    scorinateFirstMatch();
    const { folder } = memory;
    useDatabaseStore.setState({
      folder: {
        ...folder,
        save: async (wrappers, manifest) => {
          // The user scorinates again while the file writes.
          const wrapper = state().leagues[LEAGUE];
          useDatabaseStore.setState((s) => ({
            leagues: { ...s.leagues, [LEAGUE]: { ...wrapper } },
          }));
          await folder.save(wrappers, manifest);
        },
      },
    });
    await saveDatabase();

    expect(isLeagueUnsaved(state(), LEAGUE)).toBe(true);
  });

  it('rejects a failed write and changes no snapshot', async () => {
    const memory = await openWithLeague();
    scorinateFirstMatch();
    useDatabaseStore.setState({
      folder: {
        ...memory.folder,
        save: async () => {
          throw new Error('disk full');
        },
      },
    });

    await expect(saveDatabase()).rejects.toThrow('disk full');
    expect(isLeagueUnsaved(state(), LEAGUE)).toBe(true);
    expect(isManifestUnsaved(state())).toBe(true);
  });

  it('rejects when the database is not open', async () => {
    await expect(saveDatabase()).rejects.toThrow('The database is not open.');
  });
});
