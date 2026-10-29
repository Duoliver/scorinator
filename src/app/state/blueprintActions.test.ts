import { beforeEach, describe, expect, it } from 'vitest';
import { isUuidV4 } from '@/engine/identity';
import {
  blueprint,
  HARBORVIEW,
  INSTALLATION,
  leagueWrapper,
  memoryFolder,
  SALT_MARSH,
} from '@/test/databaseRecords';
import { serializeManifestRecord } from '@/app/data/databaseFile';
import { addBlueprint, importBlueprints, updateBlueprint } from './blueprintActions';
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

describe('addBlueprint (US-09.1, US-11.1)', () => {
  it('makes a Blueprint with a new UUID, a slug, and the local provenance', async () => {
    await openWithBlueprint();
    const added = addBlueprint({
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
    const added = addBlueprint({
      name: 'Salt Marsh United',
      colour: '#000',
      tier: 'D',
    });
    expect(added.slug).toBe('salt-marsh-united-2');
  });

  it('gives each new Blueprint its own UUID', async () => {
    await openWithBlueprint();
    const a = addBlueprint({ name: 'A', colour: '#000', tier: 'D' });
    const b = addBlueprint({ name: 'B', colour: '#000', tier: 'D' });
    expect(a.uuid).not.toBe(b.uuid);
  });

  it('defaults to an empty location and no trigrams', async () => {
    await openWithBlueprint();
    const added = addBlueprint({ name: 'A', colour: '#000', tier: 'D' });
    expect(added.location).toBe('');
    expect(added.trigrams).toEqual([]);
  });

  it('throws the slug RangeError for a name with no letter or number, and adds nothing', async () => {
    await openWithBlueprint();
    expect(() => addBlueprint({ name: '!!!', colour: '#000', tier: 'D' })).toThrow(
      RangeError
    );
    expect(state().blueprints).toHaveLength(1);
  });

  it('throws when the database is not open', () => {
    expect(() => addBlueprint({ name: 'A', colour: '#000', tier: 'D' })).toThrow(
      'The database is not open.'
    );
  });
});

describe('updateBlueprint (US-09.1, US-09.5)', () => {
  it('changes the fields, keeps the slug and the UUID, and stamps the local installation', async () => {
    await openWithBlueprint();
    updateBlueprint(SALT_MARSH, {
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
    updateBlueprint(SALT_MARSH, { name: 'Salt Marsh United', trigrams: ['SMU'] });

    expect(state().blueprints).toBe(before);
    expect(areBlueprintsUnsaved(state())).toBe(false);
  });

  it('changes no league Instance (US-09.2)', async () => {
    await openWithBlueprint();
    const wrapper = leagueWrapper();
    useDatabaseStore.setState({ leagues: { [wrapper.uuid]: wrapper } });
    updateBlueprint(SALT_MARSH, { name: 'Salt Marsh FC' });

    expect(state().leagues[wrapper.uuid]).toBe(wrapper);
  });

  it('throws a RangeError for an unknown Blueprint', async () => {
    await openWithBlueprint();
    expect(() => updateBlueprint(HARBORVIEW, { name: 'X' })).toThrow(
      `No Blueprint has the UUID ${HARBORVIEW}.`
    );
  });
});

describe('importBlueprints (Task 75)', () => {
  it('updates the name, colour, and tier of a matching slug, keeps the rest, and stamps it', async () => {
    await openWithBlueprint();
    const counts = importBlueprints([
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
    const counts = importBlueprints([
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
    const counts = importBlueprints([
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
    const counts = importBlueprints([
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
});
