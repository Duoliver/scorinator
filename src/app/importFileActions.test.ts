import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  applyFileImport,
  getImportRows,
  planBlueprintFileImport,
  planDatabaseFileImport,
  planLeagueFileImport,
} from './importFileActions';
import * as exportFile from '@/app/data/exportFile';
import * as databaseZip from '@/app/data/databaseZip';
import { packDatabase } from '@/app/data/databaseZip';
import { useDatabaseStore } from '@/app/state/databaseStore';
import { useStatusLineStore } from '@/app/state/statusLineStore';
import { summarizeLeague } from '@/app/state/summarizeLeague';
import type { ImportChoice } from '@/engine/identity';
import type { LeagueWrapper, TeamBlueprint } from '@/domain';
import {
  blueprint,
  HARBORVIEW,
  INSTALLATION,
  LEAGUE,
  leagueWrapper,
  openTestDatabase,
  openTestLeague,
  OTHER_LEAGUE,
  SALT_MARSH,
} from '@/test/databaseRecords';

const NO_CHOICES: ReadonlyMap<string, ImportChoice> = new Map();
const message = (): string | undefined => useStatusLineStore.getState().status?.message;
const state = (): ReturnType<typeof useDatabaseStore.getState> =>
  useDatabaseStore.getState();

const harborview = blueprint({
  uuid: HARBORVIEW,
  slug: 'harborview-sc',
  name: 'Harborview SC',
});
const renamed = (wrapper: LeagueWrapper): LeagueWrapper => ({
  ...wrapper,
  content: { ...wrapper.content, name: 'Changed name' },
});
const setBlueprints = (blueprints: TeamBlueprint[]): void => {
  useDatabaseStore.setState({ blueprints, savedBlueprints: blueprints });
};
const selectAll = (uuids: string[]): ReadonlySet<string> => new Set(uuids);

beforeEach(() => {
  vi.restoreAllMocks();
  openTestDatabase([]);
  useStatusLineStore.setState({ status: null });
});

describe('planLeagueFileImport', () => {
  it('gives null with no message when the dialog is canceled', async () => {
    vi.spyOn(exportFile, 'openLeagueImportFile').mockResolvedValue(null);
    expect(await planLeagueFileImport()).toBeNull();
    expect(useStatusLineStore.getState().status).toBeNull();
  });

  it('shows the error of a bad file, and imports nothing', async () => {
    vi.spyOn(exportFile, 'openLeagueImportFile').mockRejectedValue(
      new Error('Not valid')
    );
    expect(await planLeagueFileImport()).toBeNull();
    expect(useStatusLineStore.getState().status).toEqual({
      tone: 'error',
      message: 'Not valid',
    });
    expect(state().leagues).toEqual({});
  });

  it('tags a real conflict only, and not a row with the same content (choice 2)', async () => {
    const same = openTestLeague(leagueWrapper());
    const differs = openTestLeague(leagueWrapper([], OTHER_LEAGUE));
    const unknown = leagueWrapper([], '00000000-0000-4000-8000-0000000000b3');
    vi.spyOn(exportFile, 'openLeagueImportFile').mockResolvedValue({
      leagues: [same, renamed(differs), unknown],
      blueprints: [],
    });

    const pending = await planLeagueFileImport();

    expect(getImportRows(pending!)).toEqual([
      { uuid: LEAGUE, name: 'Coastal Premier', type: 'league', conflict: false },
      { uuid: OTHER_LEAGUE, name: 'Changed name', type: 'league', conflict: true },
      { uuid: unknown.uuid, name: 'Coastal Premier', type: 'league', conflict: false },
    ]);
  });
});

describe('applyFileImport: leagues', () => {
  const planFile = async (
    leagues: LeagueWrapper[],
    blueprints: TeamBlueprint[] = []
  ): Promise<NonNullable<Awaited<ReturnType<typeof planLeagueFileImport>>>> => {
    vi.spyOn(exportFile, 'openLeagueImportFile').mockResolvedValue({
      leagues,
      blueprints,
    });
    return (await planLeagueFileImport())!;
  };

  it('imports only the selected leagues', async () => {
    const pending = await planFile([leagueWrapper(), leagueWrapper([], OTHER_LEAGUE)]);
    applyFileImport(pending, selectAll([OTHER_LEAGUE]), NO_CHOICES);
    expect(Object.keys(state().leagues)).toEqual([OTHER_LEAGUE]);
    expect(message()).toBe('1 league imported.');
  });

  it('counts the embedded teams it adds', async () => {
    const pending = await planFile([leagueWrapper()], [blueprint(), harborview]);
    applyFileImport(pending, selectAll([LEAGUE]), NO_CHOICES);
    expect(state().blueprints.map((b) => b.uuid)).toEqual([SALT_MARSH, HARBORVIEW]);
    expect(message()).toBe('1 league imported. 2 teams added.');
  });

  it('skips a conflict by default, and leaves the local league alone', async () => {
    const local = openTestLeague(leagueWrapper());
    const pending = await planFile([renamed(local)]);
    applyFileImport(pending, selectAll([LEAGUE]), NO_CHOICES);
    expect(state().leagues[LEAGUE]).toBe(local);
    expect(message()).toBe('0 leagues imported. 1 skipped.');
  });

  it('forks a conflict on "Import as new", with a fresh UUID', async () => {
    const local = openTestLeague(leagueWrapper());
    const pending = await planFile([renamed(local)]);
    applyFileImport(pending, selectAll([LEAGUE]), new Map([[LEAGUE, 'new']]));
    const uuids = Object.keys(state().leagues);
    expect(uuids).toHaveLength(2);
    expect(state().leagues[LEAGUE]).toBe(local);
    expect(message()).toBe('0 leagues imported. 1 imported as new.');
  });

  it('counts a league with the same content as up to date', async () => {
    const local = openTestLeague(leagueWrapper());
    const pending = await planFile([local]);
    applyFileImport(pending, selectAll([LEAGUE]), NO_CHOICES);
    expect(message()).toBe('0 leagues imported. 1 already up to date.');
  });

  it('gives every count in the agreed order', async () => {
    const local = openTestLeague(leagueWrapper());
    const other = openTestLeague(leagueWrapper([], OTHER_LEAGUE));
    const third = '00000000-0000-4000-8000-0000000000b3';
    const fourth = openTestLeague(
      leagueWrapper([], '00000000-0000-4000-8000-0000000000b4')
    );
    const pending = await planFile([
      renamed(local),
      renamed(other),
      fourth,
      leagueWrapper([], third),
    ]);
    applyFileImport(
      pending,
      selectAll([LEAGUE, OTHER_LEAGUE, fourth.uuid, third]),
      new Map([[LEAGUE, 'new']])
    );
    expect(message()).toBe(
      '1 league imported. 1 imported as new. 1 skipped. 1 already up to date.'
    );
  });
});

describe('applyFileImport: Blueprints', () => {
  const planFile = async (
    blueprints: TeamBlueprint[]
  ): Promise<NonNullable<Awaited<ReturnType<typeof planBlueprintFileImport>>>> => {
    vi.spyOn(exportFile, 'openBlueprintImportFile').mockResolvedValue(blueprints);
    return (await planBlueprintFileImport())!;
  };

  it('gives one team row for each Blueprint', async () => {
    const pending = await planFile([blueprint()]);
    expect(getImportRows(pending)).toEqual([
      { uuid: SALT_MARSH, name: 'Salt Marsh United', type: 'team', conflict: false },
    ]);
  });

  it('imports the selected Blueprints, with the counts', async () => {
    const pending = await planFile([blueprint(), harborview]);
    applyFileImport(pending, selectAll([SALT_MARSH, HARBORVIEW]), NO_CHOICES);
    expect(state().blueprints).toHaveLength(2);
    expect(message()).toBe('2 teams imported.');
  });

  it('forks a Blueprint conflict with the local installation', async () => {
    setBlueprints([blueprint()]);
    const incoming = blueprint({
      name: 'Other name',
      createdByInstallation: '00000000-0000-4000-8000-00000000000f',
    });
    const pending = await planFile([incoming]);
    applyFileImport(pending, selectAll([SALT_MARSH]), new Map([[SALT_MARSH, 'new']]));
    expect(state().blueprints).toHaveLength(2);
    expect(state().blueprints[1].createdByInstallation).toBe(INSTALLATION);
    expect(state().blueprints[1].slug).toBe('salt-marsh-united-2');
    expect(message()).toBe('0 teams imported. 1 imported as new.');
  });
});

describe('the database import', () => {
  const zipOf = (blueprints: TeamBlueprint[], leagues: LeagueWrapper[]): Uint8Array =>
    packDatabase(
      {
        installationUuid: INSTALLATION,
        blueprints,
        wrappers: leagues.map(summarizeLeague),
      },
      leagues
    );

  it('gives teams and leagues in one list, Blueprints first', async () => {
    setBlueprints([blueprint()]);
    const local = openTestLeague(leagueWrapper());
    vi.spyOn(databaseZip, 'openDatabaseZipFile').mockResolvedValue(
      zipOf([blueprint({ name: 'Other name' }), harborview], [renamed(local)])
    );
    const pending = await planDatabaseFileImport();
    expect(getImportRows(pending!)).toEqual([
      { uuid: SALT_MARSH, name: 'Other name', type: 'team', conflict: true },
      { uuid: HARBORVIEW, name: 'Harborview SC', type: 'team', conflict: false },
      { uuid: LEAGUE, name: 'Changed name', type: 'league', conflict: true },
    ]);
  });

  it('applies the choices of both kinds, and gives both counts', async () => {
    setBlueprints([blueprint()]);
    const local = openTestLeague(leagueWrapper());
    vi.spyOn(databaseZip, 'openDatabaseZipFile').mockResolvedValue(
      zipOf([blueprint({ name: 'Other name' }), harborview], [renamed(local)])
    );
    const pending = (await planDatabaseFileImport())!;
    const all = getImportRows(pending).map((row) => row.uuid);
    applyFileImport(pending, selectAll(all), new Map([[LEAGUE, 'new']]));
    expect(message()).toBe(
      'Teams: 1 imported, 1 skipped. Leagues: 0 imported, 1 imported as new.'
    );
  });

  it('shows the error of a zip that is not a database', async () => {
    vi.spyOn(databaseZip, 'openDatabaseZipFile').mockResolvedValue(
      new Uint8Array([1, 2])
    );
    expect(await planDatabaseFileImport()).toBeNull();
    expect(useStatusLineStore.getState().status?.tone).toBe('error');
    expect(message()).toContain('not a Scorinator database');
  });

  it('gives null with no message when the dialog is canceled', async () => {
    vi.spyOn(databaseZip, 'openDatabaseZipFile').mockResolvedValue(null);
    expect(await planDatabaseFileImport()).toBeNull();
    expect(useStatusLineStore.getState().status).toBeNull();
  });
});
