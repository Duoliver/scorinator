import { beforeEach, describe, expect, it } from 'vitest';
import { isUuidV4, type ImportChoice, type RandomBytes } from '@/engine/identity';
import type { LeagueWrapper, TeamBlueprint } from '@/domain';
import {
  blueprint,
  HARBORVIEW,
  INSTALLATION,
  LEAGUE,
  leagueWrapper,
  openTestDatabase,
  openTestLeague,
  result,
  SALT_MARSH,
  testUuid,
} from '@/test/databaseRecords';
import { serializeLeagueWrapper } from '@/app/data/databaseFile';
import {
  importBlueprints,
  importLeagues,
  planBlueprintImport,
  planLeagueImport,
} from './importActions';
import { saveDatabase } from './databaseActions';
import {
  currentRows,
  isDatabaseUnsaved,
  isLeagueUnsaved,
  useDatabaseStore,
} from './databaseStore';
import { summarizeLeague } from './summarizeLeague';

const OTHER = '00000000-0000-4000-8000-0000000000ff';
const fromOther = { createdByInstallation: OTHER, lastModifiedByInstallation: OTHER };
const state = (): ReturnType<typeof useDatabaseStore.getState> =>
  useDatabaseStore.getState();
const choose = (entries: [string, ImportChoice][]): ReadonlyMap<string, ImportChoice> =>
  new Map(entries);
/** A fixed random source, so a fresh UUID is a valid v4. */
const bytes: RandomBytes = (length) => new Uint8Array(length).fill(7);

/** Opens a database with the Salt Marsh Blueprint, made locally. */
function openWithSaltMarsh(): void {
  openTestDatabase();
  const blueprints = [blueprint()];
  useDatabaseStore.setState({ blueprints, savedBlueprints: blueprints });
}

beforeEach(() => {
  useDatabaseStore.setState(useDatabaseStore.getInitialState(), true);
});

describe('the Blueprint import (US-11.2, Task 144)', () => {
  it('imports an unknown UUID as it is, with the provenance of the file', () => {
    openWithSaltMarsh();
    const incoming = blueprint({
      uuid: HARBORVIEW,
      slug: 'harborview-sc',
      name: 'Harborview SC',
      ...fromOther,
    });
    const steps = planBlueprintImport([incoming]);
    expect(steps.map((step) => step.kind)).toEqual(['new']);

    const counts = importBlueprints(steps, choose([]));
    expect(counts).toEqual({ imported: 1, importedAsNew: 0, skipped: 0, upToDate: 0 });
    expect(state().blueprints).toEqual([blueprint(), incoming]);
    expect(isDatabaseUnsaved(state())).toBe(true);
  });

  it('imports nothing for a known UUID with the same content, also with other provenance', () => {
    openWithSaltMarsh();
    const before = state().blueprints;
    const steps = planBlueprintImport([blueprint(fromOther)]);
    expect(steps.map((step) => step.kind)).toEqual(['same']);

    expect(importBlueprints(steps, choose([])).upToDate).toBe(1);
    expect(state().blueprints).toBe(before);
    expect(isDatabaseUnsaved(state())).toBe(false);
  });

  it('Skip keeps the local Blueprint and drops the incoming one', () => {
    openWithSaltMarsh();
    const before = state().blueprints;
    const steps = planBlueprintImport([
      blueprint({ name: 'Salt Marsh FC', ...fromOther }),
    ]);
    expect(steps.map((step) => step.kind)).toEqual(['conflict']);

    expect(importBlueprints(steps, choose([[SALT_MARSH, 'skip']])).skipped).toBe(1);
    expect(state().blueprints).toBe(before);
  });

  it('Import as new gives a fresh UUID, the local provenance, and a "-2" slug', () => {
    openWithSaltMarsh();
    const incoming = blueprint({ name: 'Salt Marsh FC', ...fromOther });
    const steps = planBlueprintImport([incoming]);

    const counts = importBlueprints(steps, choose([[SALT_MARSH, 'new']]), bytes);
    expect(counts.importedAsNew).toBe(1);
    const [local, added] = state().blueprints;
    expect(local).toEqual(blueprint());
    expect(isUuidV4(added.uuid)).toBe(true);
    expect(added.uuid).not.toBe(SALT_MARSH);
    expect(added).toEqual({
      ...incoming,
      uuid: added.uuid,
      slug: 'salt-marsh-united-2',
      createdByInstallation: INSTALLATION,
      lastModifiedByInstallation: INSTALLATION,
    });
  });

  it('gives an unknown Blueprint a "-2" slug when its slug is taken, and keeps its UUID (choice 4)', () => {
    openWithSaltMarsh();
    const incoming = [
      blueprint({ uuid: testUuid(1), ...fromOther }),
      blueprint({ uuid: testUuid(2), ...fromOther }),
    ];
    importBlueprints(planBlueprintImport(incoming), choose([]));
    expect(
      state().blueprints.map((b) => [b.uuid, b.slug, b.createdByInstallation])
    ).toEqual([
      [SALT_MARSH, 'salt-marsh-united', INSTALLATION],
      [testUuid(1), 'salt-marsh-united-2', OTHER],
      [testUuid(2), 'salt-marsh-united-3', OTHER],
    ]);
  });
});

describe('the league import (US-11.2, US-10.3, Task 144)', () => {
  const harborview = blueprint({
    uuid: HARBORVIEW,
    slug: 'harborview-sc',
    name: 'Harborview SC',
    colour: '#E53935',
    tier: 'C',
    ...fromOther,
  });
  const fromFile = (wrapper: LeagueWrapper): LeagueWrapper => ({
    ...wrapper,
    content: { ...wrapper.content, ...fromOther },
  });

  it('imports an unknown league as it is, unsaved, with its manifest row', async () => {
    openWithSaltMarsh();
    const incoming = fromFile(leagueWrapper());
    const steps = await planLeagueImport([incoming]);
    expect(steps.map((step) => step.kind)).toEqual(['new']);

    const counts = importLeagues(steps, choose([]), []);
    expect(counts).toEqual({
      imported: 1,
      importedAsNew: 0,
      skipped: 0,
      upToDate: 0,
      blueprintsAdded: 0,
    });
    expect(state().leagues[LEAGUE]).toEqual(incoming);
    expect(isLeagueUnsaved(state(), LEAGUE)).toBe(true);
    expect(currentRows(state()).map((row) => row.uuid)).toEqual([LEAGUE]);
  });

  it('adds an unknown embedded Blueprint, and keeps a known one with no prompt', async () => {
    openWithSaltMarsh();
    const changedSaltMarsh = blueprint({ name: 'Salt Marsh FC', ...fromOther });
    const notInTheLeague = blueprint({ uuid: testUuid(9), slug: 'nine', ...fromOther });
    importLeagues(await planLeagueImport([fromFile(leagueWrapper())]), choose([]), [
      changedSaltMarsh,
      harborview,
      notInTheLeague,
    ]);
    expect(state().blueprints).toEqual([blueprint(), harborview]);
  });

  it('adds an embedded Blueprint once, when two leagues name it', async () => {
    openWithSaltMarsh();
    const counts = importLeagues(
      await planLeagueImport([
        fromFile(leagueWrapper()),
        fromFile(leagueWrapper([], testUuid(50))),
      ]),
      choose([]),
      [harborview]
    );
    expect(counts.blueprintsAdded).toBe(1);
    expect(state().blueprints.map((b) => b.uuid)).toEqual([SALT_MARSH, HARBORVIEW]);
  });

  it('imports nothing for a known league with the same content', async () => {
    openWithSaltMarsh();
    openTestLeague(leagueWrapper());
    const steps = await planLeagueImport([fromFile(leagueWrapper())]);
    expect(steps.map((step) => step.kind)).toEqual(['same']);

    expect(importLeagues(steps, choose([]), [harborview]).upToDate).toBe(1);
    expect(state().blueprints).toEqual([blueprint()]);
    expect(isDatabaseUnsaved(state())).toBe(false);
  });

  it('loads a known league that is not loaded, to compare it (choice 3)', async () => {
    const memory = openTestDatabase();
    const local = leagueWrapper();
    memory.files.wrappers[LEAGUE] = serializeLeagueWrapper(local);
    const row = summarizeLeague(local);
    useDatabaseStore.setState({ rows: [row], savedRows: [row] });

    const played = fromFile(
      leagueWrapper([result('p1.g1.md1.m1', SALT_MARSH, HARBORVIEW)])
    );
    const steps = await planLeagueImport([played]);
    expect(steps.map((step) => step.kind)).toEqual(['conflict']);
    expect(state().leagues[LEAGUE]).toEqual(local);
    expect(isLeagueUnsaved(state(), LEAGUE)).toBe(false);
  });

  it('Skip keeps the local league, and adds none of its embedded Blueprints', async () => {
    openWithSaltMarsh();
    const local = openTestLeague(leagueWrapper());
    const played = fromFile(
      leagueWrapper([result('p1.g1.md1.m1', SALT_MARSH, HARBORVIEW)])
    );
    const steps = await planLeagueImport([played]);

    const counts = importLeagues(steps, choose([[LEAGUE, 'skip']]), [harborview]);
    expect(counts).toMatchObject({ skipped: 1, blueprintsAdded: 0 });
    expect(state().leagues[LEAGUE]).toBe(local);
    expect(state().blueprints).toEqual([blueprint()]);
  });

  it('Import as new gives a fresh UUID and the local provenance, and keeps the name and the Instances', async () => {
    openWithSaltMarsh();
    const local = openTestLeague(leagueWrapper());
    const played = fromFile(
      leagueWrapper([result('p1.g1.md1.m1', SALT_MARSH, HARBORVIEW)])
    );
    const steps = await planLeagueImport([played]);

    const counts = importLeagues(steps, choose([[LEAGUE, 'new']]), [harborview], bytes);
    expect(counts).toMatchObject({ importedAsNew: 1, blueprintsAdded: 1 });
    expect(state().leagues[LEAGUE]).toBe(local);
    const [forked] = Object.values(state().leagues).filter((w) => w.uuid !== LEAGUE);
    expect(isUuidV4(forked.uuid)).toBe(true);
    expect(forked).toEqual({
      ...played,
      uuid: forked.uuid,
      content: {
        ...played.content,
        uuid: forked.uuid,
        createdByInstallation: INSTALLATION,
        lastModifiedByInstallation: INSTALLATION,
      },
    });
    expect(isLeagueUnsaved(state(), forked.uuid)).toBe(true);
  });

  it('Ctrl+S writes an imported league to its own wrapper file', async () => {
    const memory = openTestDatabase();
    const incoming: TeamBlueprint[] = [blueprint(fromOther), harborview];
    importLeagues(
      await planLeagueImport([fromFile(leagueWrapper())]),
      choose([]),
      incoming
    );
    await saveDatabase();
    expect(Object.keys(memory.files.wrappers)).toEqual([LEAGUE]);
    expect(memory.files.manifest).toContain(LEAGUE);
    expect(isDatabaseUnsaved(state())).toBe(false);
  });
});
