import { beforeEach, describe, expect, it } from 'vitest';
import { isUuidV4 } from '@/engine/identity';
import {
  blueprint,
  HARBORVIEW,
  INSTALLATION,
  leagueWrapper,
  memoryFolder,
  roundRobinLeague,
  SALT_MARSH,
} from '@/test/databaseRecords';
import {
  serializeLeagueWrapper,
  serializeManifestRecord,
} from '@/app/data/databaseFile';
import { summarizeLeague } from './summarizeLeague';
import {
  addTeamBlueprint,
  countLeaguesUsingBlueprint,
  deleteTeamBlueprint,
  importTeamBlueprints,
  previewTeamImport,
  updateTeamBlueprint,
} from './teamBlueprintActions';
import { openDatabase } from './databaseActions';
import {
  areBlueprintsUnsaved,
  useDatabaseStore,
  type DatabaseState,
} from './databaseStore';

const OTHER_INSTALLATION = '00000000-0000-4000-8000-0000000000ff';
const state = (): DatabaseState => useDatabaseStore.getState();

/** Opens a database whose one Blueprint another installation made. */
async function openWithBlueprint(): Promise<void> {
  const made = blueprint({
    createdByInstallation: OTHER_INSTALLATION,
    lastModifiedByInstallation: OTHER_INSTALLATION,
  });
  const manifest = serializeManifestRecord({
    installationUuid: INSTALLATION,
    blueprints: [made],
    wrappers: [],
  });
  await openDatabase(memoryFolder({ manifest }).folder);
}

beforeEach(() => {
  useDatabaseStore.setState(useDatabaseStore.getInitialState(), true);
});

describe('addTeamBlueprint (US-09.1, US-11.1)', () => {
  it('makes a Blueprint with a new UUID, a slug, and the local provenance', async () => {
    await openWithBlueprint();
    const added = addTeamBlueprint({
      name: 'Harborview SC',
      colour: '#E53935',
      tier: 'C',
      location: 'Harborview',
      trigrams: ['HSC'],
    });

    expect(isUuidV4(added.uuid)).toBe(true);
    expect(added).toMatchObject({
      slug: 'harborview-sc',
      name: 'Harborview SC',
      colour: '#E53935',
      tier: 'C',
      location: 'Harborview',
      trigrams: ['HSC'],
      createdByInstallation: INSTALLATION,
      lastModifiedByInstallation: INSTALLATION,
    });
    expect(state().blueprints.map((b) => b.uuid)).toEqual([SALT_MARSH, added.uuid]);
    expect(areBlueprintsUnsaved(state())).toBe(true);
  });

  it('gives a second Blueprint with the same name the -2 slug (Task 75)', async () => {
    await openWithBlueprint();
    const added = addTeamBlueprint({
      name: 'Salt Marsh United',
      colour: '#000',
      tier: 'D',
    });
    expect(added.slug).toBe('salt-marsh-united-2');
  });

  it('gives each new Blueprint its own UUID', async () => {
    await openWithBlueprint();
    const a = addTeamBlueprint({ name: 'A', colour: '#000', tier: 'D' });
    const b = addTeamBlueprint({ name: 'B', colour: '#000', tier: 'D' });
    expect(a.uuid).not.toBe(b.uuid);
  });

  it('defaults to an empty location and no trigrams', async () => {
    await openWithBlueprint();
    const added = addTeamBlueprint({ name: 'A', colour: '#000', tier: 'D' });
    expect(added.location).toBe('');
    expect(added.trigrams).toEqual([]);
  });

  it('throws the slug RangeError for a name with no letter or number, and adds nothing', async () => {
    await openWithBlueprint();
    expect(() => addTeamBlueprint({ name: '!!!', colour: '#000', tier: 'D' })).toThrow(
      RangeError
    );
    expect(state().blueprints).toHaveLength(1);
  });

  it('throws when the database is not open', () => {
    expect(() => addTeamBlueprint({ name: 'A', colour: '#000', tier: 'D' })).toThrow(
      'The database is not open.'
    );
  });
});

describe('updateTeamBlueprint (US-09.1, US-09.5)', () => {
  it('changes the fields, keeps the slug and the UUID, and stamps the local installation', async () => {
    await openWithBlueprint();
    updateTeamBlueprint(SALT_MARSH, {
      name: 'Salt Marsh FC',
      tier: 'A',
      location: 'Dunmore',
    });

    expect(state().blueprints[0]).toMatchObject({
      uuid: SALT_MARSH,
      slug: 'salt-marsh-united',
      name: 'Salt Marsh FC',
      tier: 'A',
      location: 'Dunmore',
      createdByInstallation: OTHER_INSTALLATION,
      lastModifiedByInstallation: INSTALLATION,
    });
    expect(areBlueprintsUnsaved(state())).toBe(true);
  });

  it('makes no new object for an update with no real change', async () => {
    await openWithBlueprint();
    const before = state().blueprints;
    updateTeamBlueprint(SALT_MARSH, { name: 'Salt Marsh United', trigrams: ['SMU'] });

    expect(state().blueprints).toBe(before);
    expect(areBlueprintsUnsaved(state())).toBe(false);
  });

  it('changes no league Instance (US-09.2)', async () => {
    await openWithBlueprint();
    const wrapper = leagueWrapper();
    useDatabaseStore.setState({ leagues: { [wrapper.uuid]: wrapper } });
    updateTeamBlueprint(SALT_MARSH, { name: 'Salt Marsh FC' });

    expect(state().leagues[wrapper.uuid]).toBe(wrapper);
  });

  it('throws a RangeError for an unknown Blueprint', async () => {
    await openWithBlueprint();
    expect(() => updateTeamBlueprint(HARBORVIEW, { name: 'X' })).toThrow(
      `No Blueprint has the UUID ${HARBORVIEW}.`
    );
  });
});

describe('updateTeamBlueprint, a new slug (US-09.5, Task 119 choice 8)', () => {
  it('sets a new slug that no other Blueprint has', async () => {
    await openWithBlueprint();
    updateTeamBlueprint(SALT_MARSH, { slug: 'salt-marsh-fc' });
    expect(state().blueprints[0]).toMatchObject({
      uuid: SALT_MARSH,
      slug: 'salt-marsh-fc',
      lastModifiedByInstallation: INSTALLATION,
    });
  });

  it('throws a RangeError for a slug of another Blueprint, and changes nothing', async () => {
    await openWithBlueprint();
    addTeamBlueprint({ name: 'Harborview SC', colour: '#E53935', tier: 'C' });
    const before = state().blueprints;
    expect(() => updateTeamBlueprint(SALT_MARSH, { slug: 'harborview-sc' })).toThrow(
      'Another Blueprint has the slug harborview-sc.'
    );
    expect(state().blueprints).toBe(before);
  });

  it('changes no league Instance', async () => {
    await openWithBlueprint();
    const wrapper = leagueWrapper();
    useDatabaseStore.setState({ leagues: { [wrapper.uuid]: wrapper } });
    updateTeamBlueprint(SALT_MARSH, { slug: 'salt-marsh-fc' });
    expect(state().leagues[wrapper.uuid]).toBe(wrapper);
  });
});

describe('deleteTeamBlueprint (US-09.4)', () => {
  it('removes the Blueprint, and leaves its slug free', async () => {
    await openWithBlueprint();
    deleteTeamBlueprint(SALT_MARSH);
    expect(state().blueprints).toEqual([]);
    expect(areBlueprintsUnsaved(state())).toBe(true);
    const again = addTeamBlueprint({
      name: 'Salt Marsh United',
      colour: '#000',
      tier: 'B',
    });
    expect(again.slug).toBe('salt-marsh-united');
  });

  it('keeps the Instances of the Blueprint in each league (US-09.2)', async () => {
    await openWithBlueprint();
    const wrapper = leagueWrapper();
    useDatabaseStore.setState({ leagues: { [wrapper.uuid]: wrapper } });
    deleteTeamBlueprint(SALT_MARSH);
    expect(state().leagues[wrapper.uuid]).toBe(wrapper);
  });

  it('throws a RangeError for an unknown Blueprint', async () => {
    await openWithBlueprint();
    expect(() => deleteTeamBlueprint(HARBORVIEW)).toThrow(
      `No Blueprint has the UUID ${HARBORVIEW}.`
    );
  });
});

describe('countLeaguesUsingBlueprint (US-09.4, Task 119 choice 7)', () => {
  const SAVED = '00000000-0000-4000-8000-0000000000c1';
  const OTHER = '00000000-0000-4000-8000-0000000000c2';
  const NEW = '00000000-0000-4000-8000-0000000000c3';

  /** Two saved leagues on disk, one with Salt Marsh and one without it,
   * and one new league in memory with Salt Marsh. */
  async function openWithLeagues(): Promise<void> {
    const withSaltMarsh = leagueWrapper([], SAVED);
    // Its teams have the Blueprint UUIDs testUuid(1) and testUuid(2).
    const without = roundRobinLeague(
      [
        { name: 'Team One', colour: '#000' },
        { name: 'Team Two', colour: '#fff' },
      ],
      { uuid: OTHER }
    );
    const manifest = serializeManifestRecord({
      installationUuid: INSTALLATION,
      blueprints: [blueprint()],
      wrappers: [summarizeLeague(withSaltMarsh), summarizeLeague(without)],
    });
    await openDatabase(
      memoryFolder({
        manifest,
        wrappers: {
          [SAVED]: serializeLeagueWrapper(withSaltMarsh),
          [OTHER]: serializeLeagueWrapper(without),
        },
      }).folder
    );
    const added = leagueWrapper([], NEW);
    useDatabaseStore.setState({ leagues: { ...state().leagues, [NEW]: added } });
  }

  it('counts every league with an Instance of the Blueprint, saved or new', async () => {
    await openWithLeagues();
    expect(await countLeaguesUsingBlueprint(SALT_MARSH)).toBe(2);
  });

  it('opens the saved leagues that are not in memory yet', async () => {
    await openWithLeagues();
    await countLeaguesUsingBlueprint(SALT_MARSH);
    expect(Object.keys(state().leagues).sort()).toEqual([NEW, SAVED, OTHER].sort());
  });

  it('gives 0 for a Blueprint that no league uses', async () => {
    await openWithLeagues();
    expect(
      await countLeaguesUsingBlueprint('00000000-0000-4000-8000-0000000000d9')
    ).toBe(0);
  });
});

describe('importTeamBlueprints (Task 75)', () => {
  it('updates the name, colour, and tier of a matching slug, keeps the rest, and stamps it', async () => {
    await openWithBlueprint();
    const counts = importTeamBlueprints([
      {
        slug: 'salt-marsh-united',
        name: 'Salt Marsh FC',
        colour: '#000000',
        tier: 'A',
      },
    ]);

    expect(counts).toEqual({ added: 0, updated: 1 });
    expect(state().blueprints).toEqual([
      blueprint({
        name: 'Salt Marsh FC',
        colour: '#000000',
        tier: 'A',
        createdByInstallation: OTHER_INSTALLATION,
        lastModifiedByInstallation: INSTALLATION,
      }),
    ]);
  });

  it('makes a new Blueprint for a new slug, and gives a blank slug a unique one', async () => {
    await openWithBlueprint();
    const counts = importTeamBlueprints([
      { slug: 'harborview-sc', name: 'Harborview SC', colour: '#E53935', tier: 'C' },
      { slug: '', name: 'Salt Marsh United', colour: '#111111', tier: 'E' },
    ]);

    expect(counts).toEqual({ added: 2, updated: 0 });
    const [, harborview, blank] = state().blueprints;
    expect(isUuidV4(harborview.uuid)).toBe(true);
    expect(harborview).toMatchObject({
      slug: 'harborview-sc',
      location: '',
      trigrams: [],
    });
    expect(blank.slug).toBe('salt-marsh-united-2');
  });

  it('takes the last of two records with the same slug', async () => {
    await openWithBlueprint();
    const counts = importTeamBlueprints([
      { slug: 'new-team', name: 'First', colour: '#000', tier: 'C' },
      { slug: 'new-team', name: 'Second', colour: '#000', tier: 'C' },
    ]);
    expect(counts).toEqual({ added: 1, updated: 0 });
    expect(state().blueprints.map((b) => b.name)).toEqual([
      'Salt Marsh United',
      'Second',
    ]);
  });

  it('counts an unchanged record as updated, but makes no new object for it', async () => {
    await openWithBlueprint();
    const before = state().blueprints;
    const counts = importTeamBlueprints([
      {
        slug: 'salt-marsh-united',
        name: 'Salt Marsh United',
        colour: '#1565C0',
        tier: 'B',
      },
    ]);
    expect(counts).toEqual({ added: 0, updated: 1 });
    expect(state().blueprints).toBe(before);
  });

  it('sets the location and the trigrams of a matching slug when the file has the columns (Task 117)', async () => {
    await openWithBlueprint();
    importTeamBlueprints([
      {
        slug: 'salt-marsh-united',
        name: 'Salt Marsh United',
        colour: '#1565C0',
        tier: 'B',
        location: 'Saltby',
        trigrams: ['SAL', 'SMU'],
      },
    ]);
    expect(state().blueprints[0]).toMatchObject({
      location: 'Saltby',
      trigrams: ['SAL', 'SMU'],
      lastModifiedByInstallation: INSTALLATION,
    });
  });

  it('clears the location and the trigrams for empty cells (Task 117, choice 3)', async () => {
    await openWithBlueprint();
    importTeamBlueprints([
      {
        slug: 'salt-marsh-united',
        name: 'Salt Marsh United',
        colour: '#1565C0',
        tier: 'B',
        location: '',
        trigrams: [],
      },
    ]);
    expect(state().blueprints[0]).toMatchObject({ location: '', trigrams: [] });
  });

  it('gives a new Blueprint the location and the trigrams of its record', async () => {
    await openWithBlueprint();
    importTeamBlueprints([
      {
        slug: 'harborview-sc',
        name: 'Harborview SC',
        colour: '#E53935',
        tier: 'C',
        location: 'Harborview',
        trigrams: ['HSC'],
      },
    ]);
    expect(state().blueprints[1]).toMatchObject({
      location: 'Harborview',
      trigrams: ['HSC'],
    });
  });
});

describe('previewTeamImport (Task 75, Task 117)', () => {
  it('gives the counts that importTeamBlueprints gives, and changes nothing', async () => {
    await openWithBlueprint();
    const before = state().blueprints;
    const records = [
      {
        slug: 'salt-marsh-united',
        name: 'Salt Marsh FC',
        colour: '#000',
        tier: 'A' as const,
      },
      {
        slug: 'harborview-sc',
        name: 'Harborview SC',
        colour: '#E53935',
        tier: 'C' as const,
      },
      { slug: '', name: 'Salt Marsh United', colour: '#111', tier: 'E' as const },
      {
        slug: 'harborview-sc',
        name: 'Harborview SC 2',
        colour: '#E53935',
        tier: 'C' as const,
      },
    ];

    expect(previewTeamImport(records)).toEqual({ added: 2, updated: 1 });
    expect(state().blueprints).toBe(before);
    expect(areBlueprintsUnsaved(state())).toBe(false);
    expect(importTeamBlueprints(records)).toEqual({ added: 2, updated: 1 });
  });

  it('counts an unchanged record as updated', async () => {
    await openWithBlueprint();
    expect(
      previewTeamImport([
        {
          slug: 'salt-marsh-united',
          name: 'Salt Marsh United',
          colour: '#1565C0',
          tier: 'B',
        },
      ])
    ).toEqual({ added: 0, updated: 1 });
  });
});
