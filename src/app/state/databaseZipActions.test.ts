import { beforeEach, describe, expect, it } from 'vitest';
import { packDatabaseZip, unpackDatabaseZip } from '@/adapters/json-io';
import type { TeamBlueprint } from '@/domain';
import {
  blueprint,
  HARBORVIEW,
  LEAGUE,
  leagueWrapper,
  openTestDatabase,
  openTestLeague,
  OTHER_LEAGUE,
  result,
  SALT_MARSH,
  SEASON,
  seasonRow,
  seasonWrapper,
} from '@/test/databaseRecords';
import {
  parseLeagueWrapper,
  parseSeasonWrapper,
  serializeLeagueWrapper,
  serializeManifestRecord,
  serializeSeasonWrapper,
} from '@/app/data/databaseFile';
import {
  exportDatabaseZip,
  importDatabase,
  planDatabaseImport,
} from './databaseZipActions';
import { currentRows, isDatabaseUnsaved, useDatabaseStore } from './databaseStore';
import { scorinateFixture } from './leagueWrapperActions';
import { summarizeLeague } from './summarizeLeague';

const OTHER = '00000000-0000-4000-8000-0000000000ff';
const harborview = blueprint({
  uuid: HARBORVIEW,
  slug: 'harborview-sc',
  name: 'Harborview SC',
  colour: '#E53935',
  tier: 'C',
});
const state = (): ReturnType<typeof useDatabaseStore.getState> =>
  useDatabaseStore.getState();

/**
 * Opens a database with two Blueprints and two leagues. LEAGUE is loaded.
 * OTHER_LEAGUE is only on disk, with a manifest row.
 */
function openSource(): ReturnType<typeof openTestDatabase> {
  const memory = openTestDatabase();
  const blueprints: TeamBlueprint[] = [blueprint(), harborview];
  useDatabaseStore.setState({ blueprints, savedBlueprints: blueprints });
  openTestLeague(leagueWrapper());
  const other = leagueWrapper([], OTHER_LEAGUE);
  memory.files.wrappers[OTHER_LEAGUE] = serializeLeagueWrapper(other);
  const rows = [...state().rows, summarizeLeague(other)];
  useDatabaseStore.setState({ rows, savedRows: rows });
  return memory;
}

beforeEach(() => {
  useDatabaseStore.setState(useDatabaseStore.getInitialState(), true);
});

describe('exportDatabaseZip (US-10.4, Task 146)', () => {
  it('holds the manifest and every league, also one that is not loaded', async () => {
    openSource();
    const bundle = unpackDatabaseZip(await exportDatabaseZip());
    expect(bundle.wrappers.map((w) => w.uuid)).toEqual([LEAGUE, OTHER_LEAGUE]);
    expect(parseLeagueWrapper(bundle.wrappers[1].contents)).toEqual(
      leagueWrapper([], OTHER_LEAGUE)
    );
  });

  it('holds the unsaved changes, from the live state', async () => {
    openSource();
    scorinateFixture(LEAGUE, 'p1.g1.md1.m1');
    const live = state().leagues[LEAGUE];
    const bundle = unpackDatabaseZip(await exportDatabaseZip());
    expect(parseLeagueWrapper(bundle.wrappers[0].contents)).toEqual(live);
    expect(bundle.manifest).toBe(
      serializeManifestRecord({
        installationUuid: state().installationUuid as string,
        blueprints: state().blueprints,
        wrappers: currentRows(state()),
        seasons: [],
      })
    );
  });

  it('does not open a league that is not loaded (choice 3)', async () => {
    openSource();
    await exportDatabaseZip();
    expect(Object.keys(state().leagues)).toEqual([LEAGUE]);
    expect(isDatabaseUnsaved(state())).toBe(false);
  });

  it('holds each Season wrapper from the folder (Task 209 choice 7)', async () => {
    const memory = openSource();
    memory.files.wrappers[SEASON] = serializeSeasonWrapper(seasonWrapper());
    useDatabaseStore.setState({
      seasonRows: [seasonRow()],
      savedSeasonRows: [seasonRow()],
    });
    const bundle = unpackDatabaseZip(await exportDatabaseZip());
    expect(bundle.seasons.map((w) => w.uuid)).toEqual([SEASON]);
    expect(parseSeasonWrapper(bundle.seasons[0].contents)).toEqual(seasonWrapper());
  });

  it('stops with the parser error for a bad league file on disk', async () => {
    const memory = openSource();
    memory.files.wrappers[OTHER_LEAGUE] = '{';
    await expect(exportDatabaseZip()).rejects.toThrow(
      'A league file is not valid: the text is not JSON.'
    );
  });
});

describe('the database import (US-10.4, Task 146)', () => {
  it('imports into an empty database with the same Blueprints and leagues', async () => {
    openSource();
    const bytes = await exportDatabaseZip();
    const source = { blueprints: state().blueprints, league: state().leagues[LEAGUE] };

    openTestDatabase();
    const plan = await planDatabaseImport(bytes);
    const counts = importDatabase(plan, new Map());
    expect(counts.blueprints.imported).toBe(2);
    expect(counts.leagues.imported).toBe(2);
    expect(state().blueprints).toEqual(source.blueprints);
    expect(state().leagues[LEAGUE]).toEqual(source.league);
    expect(state().leagues[OTHER_LEAGUE]).toEqual(leagueWrapper([], OTHER_LEAGUE));
  });

  it('skips the Seasons of a zip until Task 247 (Task 209 choice 7)', async () => {
    const memory = openSource();
    memory.files.wrappers[SEASON] = serializeSeasonWrapper(seasonWrapper());
    useDatabaseStore.setState({
      seasonRows: [seasonRow()],
      savedSeasonRows: [seasonRow()],
    });
    const bytes = await exportDatabaseZip();

    openTestDatabase();
    const counts = importDatabase(await planDatabaseImport(bytes), new Map());
    expect(counts.leagues.imported).toBe(2);
    expect(state().seasonRows).toEqual([]);
  });

  it('merges: a same entity imports nothing, and a conflict follows its choice', async () => {
    openTestDatabase();
    const changed = blueprint({
      name: 'Salt Marsh FC',
      ...{ createdByInstallation: OTHER },
    });
    const blueprints = [changed, harborview];
    const played = leagueWrapper([result('p1.g1.md1.m1', SALT_MARSH, HARBORVIEW)]);
    const bytes = packDatabaseZip({
      manifest: serializeManifestRecord({
        installationUuid: OTHER,
        blueprints,
        wrappers: [summarizeLeague(played)],
        seasons: [],
      }),
      wrappers: [{ uuid: LEAGUE, contents: serializeLeagueWrapper(played) }],
      seasons: [],
    });

    // The local database: Salt Marsh, Harborview, and the league with no result.
    const local = [blueprint(), harborview];
    useDatabaseStore.setState({ blueprints: local, savedBlueprints: local });
    openTestLeague(leagueWrapper());

    const plan = await planDatabaseImport(bytes);
    expect(plan.blueprints.map((step) => step.kind)).toEqual(['conflict', 'same']);
    expect(plan.leagues.map((step) => step.kind)).toEqual(['conflict']);

    const counts = importDatabase(
      plan,
      new Map([
        [SALT_MARSH, 'skip'],
        [LEAGUE, 'new'],
      ])
    );
    expect(counts.blueprints).toEqual({
      imported: 0,
      importedAsNew: 0,
      skipped: 1,
      upToDate: 1,
    });
    expect(counts.leagues).toMatchObject({ importedAsNew: 1, blueprintsAdded: 0 });
    expect(state().blueprints).toBe(local);
    expect(Object.keys(state().leagues)).toHaveLength(2);
  });

  it('rejects a league file in the zip that is not valid, and changes nothing', async () => {
    openTestDatabase();
    const bytes = packDatabaseZip({
      manifest: serializeManifestRecord({
        installationUuid: OTHER,
        blueprints: [],
        wrappers: [summarizeLeague(leagueWrapper())],
        seasons: [],
      }),
      wrappers: [{ uuid: LEAGUE, contents: '{' }],
      seasons: [],
    });
    await expect(planDatabaseImport(bytes)).rejects.toThrow(
      'This .zip file is not a Scorinator database: A league file is not valid: the text is not JSON.'
    );
    expect(state().leagues).toEqual({});
  });
});
