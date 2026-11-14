import { beforeEach, describe, expect, it } from 'vitest';
import { createSeededRng } from '@/engine/rng';
import { isOvrInTier } from '@/engine/tier-ovr';
import type { TeamBlueprint, TeamInstance } from '@/domain';
import {
  blueprint,
  INSTALLATION,
  memoryFolder,
  SEASON,
  seasonRow,
  seasonWrapper,
  testUuid,
} from '@/test/databaseRecords';
import {
  parseManifestRecord,
  parseSeasonWrapper,
  serializeManifestRecord,
  serializeSeasonWrapper,
} from '@/app/data/databaseFile';
import { unpackDatabaseZip } from '@/adapters/json-io';
import { openDatabase, saveDatabase } from './databaseActions';
import { exportDatabaseZip } from './databaseZipActions';
import {
  currentSeasonRows,
  isDatabaseUnsaved,
  isSeasonNameTaken,
  isSeasonUnsaved,
  requireRunningSeason,
  useDatabaseStore,
  type DatabaseState,
} from './databaseStore';
import {
  addSeasonTeams,
  createSeason,
  deleteSeason,
  finishSeason,
  openSeason,
  renameSeason,
  reopenSeason,
  updateSeasonTeam,
} from './seasonActions';

const state = (): DatabaseState => useDatabaseStore.getState();
const OTHER_INSTALLATION = '00000000-0000-4000-8000-000000000002';
const bytes =
  (fill: number) =>
  (length: number): Uint8Array =>
    new Uint8Array(length).fill(fill);

/** A database with one saved Season on disk, not open yet. The Season was
 * made by another installation. */
async function openWithSeason(): Promise<ReturnType<typeof memoryFolder>> {
  const season = seasonWrapper();
  season.content.createdByInstallation = OTHER_INSTALLATION;
  season.content.lastModifiedByInstallation = OTHER_INSTALLATION;
  const memory = memoryFolder({
    manifest: serializeManifestRecord({
      installationUuid: INSTALLATION,
      blueprints: [blueprint()],
      wrappers: [],
      seasons: [seasonRow()],
    }),
    wrappers: { [SEASON]: serializeSeasonWrapper(season) },
  });
  await openDatabase(memory.folder);
  return memory;
}

beforeEach(() => {
  useDatabaseStore.setState(useDatabaseStore.getInitialState(), true);
});

describe('createSeason (US-13.1, Task 210)', () => {
  it('opens a new, empty, unsaved Season with a row', async () => {
    await openWithSeason();
    const season = createSeason({ name: ' Copa Sul ', year: ' 4E 201 ' }, bytes(9));

    expect(season.uuid).toBe('09090909-0909-4909-8909-090909090909');
    expect(season.teams).toEqual([]);
    expect(season.content).toEqual({
      uuid: season.uuid,
      name: 'Copa Sul',
      year: '4E 201',
      finished: false,
      createdByInstallation: INSTALLATION,
      lastModifiedByInstallation: INSTALLATION,
      leagues: [],
      playoffs: [],
    });
    expect(state().seasons[season.uuid]).toBe(season);
    expect(isSeasonUnsaved(state(), season.uuid)).toBe(true);
    expect(isDatabaseUnsaved(state())).toBe(true);
    expect(currentSeasonRows(state()).map((row) => row.name)).toEqual([
      'Liga Norte',
      'Copa Sul',
    ]);
  });

  it('throws for a blank name or year, and adds nothing', async () => {
    await openWithSeason();
    expect(() => createSeason({ name: ' ', year: '1' })).toThrow(
      'A Season needs a name and a year.'
    );
    expect(() => createSeason({ name: 'Liga', year: '' })).toThrow(
      'A Season needs a name and a year.'
    );
    expect(currentSeasonRows(state())).toHaveLength(1);
  });

  it('throws for a name and a year that a Season has, in any case', async () => {
    await openWithSeason();
    expect(() => createSeason({ name: 'LIGA NORTE', year: ' 2026-27' })).toThrow(
      'A Season named "LIGA NORTE" with the year "2026-27" exists.'
    );
    expect(currentSeasonRows(state())).toHaveLength(1);
  });

  it('takes the same name with another year', async () => {
    await openWithSeason();
    createSeason({ name: 'Liga Norte', year: '2027-28' });
    expect(currentSeasonRows(state())).toHaveLength(2);
  });
});

describe('isSeasonNameTaken (US-13.1)', () => {
  it('finds a Season row with the same name and year, in any case', async () => {
    await openWithSeason();
    expect(isSeasonNameTaken(state(), ' liga norte', '2026-27 ')).toBe(true);
    expect(isSeasonNameTaken(state(), 'Liga Norte', '2026')).toBe(false);
  });

  it('skips the Season that a rename changes', async () => {
    await openWithSeason();
    expect(isSeasonNameTaken(state(), 'Liga Norte', '2026-27', SEASON)).toBe(false);
  });
});

describe('openSeason (Task 210)', () => {
  it('reads, parses, and keeps the Season, with a saved snapshot', async () => {
    await openWithSeason();
    const season = await openSeason(SEASON);
    expect(season.content.name).toBe('Liga Norte');
    expect(state().seasons[SEASON]).toBe(season);
    expect(isSeasonUnsaved(state(), SEASON)).toBe(false);
  });

  it('gives the Season from memory when it is open', async () => {
    await openWithSeason();
    const first = await openSeason(SEASON);
    expect(await openSeason(SEASON)).toBe(first);
  });

  it('rejects for a Season with no file', async () => {
    await openWithSeason();
    await expect(openSeason(testUuid(99))).rejects.toThrow(
      `The database has no file for the league ${testUuid(99)}.`
    );
  });
});

describe('renameSeason (US-13.2, Task 210)', () => {
  it('changes the name and the year, and stamps the local installation', async () => {
    await openWithSeason();
    await renameSeason(SEASON, { name: 'Liga do Norte', year: '2026' });

    const season = state().seasons[SEASON];
    expect(season.uuid).toBe(SEASON);
    expect(season.content.name).toBe('Liga do Norte');
    expect(season.content.year).toBe('2026');
    expect(season.content.createdByInstallation).toBe(OTHER_INSTALLATION);
    expect(season.content.lastModifiedByInstallation).toBe(INSTALLATION);
    expect(currentSeasonRows(state())[0]).toMatchObject({
      name: 'Liga do Norte',
      year: '2026',
    });
    expect(isSeasonUnsaved(state(), SEASON)).toBe(true);
  });

  it('takes a change of case of its own name', async () => {
    await openWithSeason();
    await renameSeason(SEASON, { name: 'LIGA NORTE', year: '2026-27' });
    expect(state().seasons[SEASON].content.name).toBe('LIGA NORTE');
  });

  it('throws for the name and year of another Season, and changes nothing', async () => {
    await openWithSeason();
    const other = createSeason({ name: 'Copa', year: '1' });
    await expect(
      renameSeason(other.uuid, { name: 'liga norte', year: '2026-27' })
    ).rejects.toThrow('A Season named "liga norte" with the year "2026-27" exists.');
    expect(state().seasons[other.uuid]).toBe(other);
  });

  it('renames a finished Season (Task 210, the user)', async () => {
    await openWithSeason();
    await openSeason(SEASON);
    finishSeason(SEASON);
    await renameSeason(SEASON, { name: 'Liga Velha', year: '2026-27' });
    expect(state().seasons[SEASON].content.name).toBe('Liga Velha');
  });
});

describe('finishSeason and reopenSeason (US-13.9, Task 210)', () => {
  it('finishes a Season, and the row shows it', async () => {
    await openWithSeason();
    await openSeason(SEASON);
    finishSeason(SEASON);
    expect(state().seasons[SEASON].content.finished).toBe(true);
    expect(state().seasons[SEASON].content.lastModifiedByInstallation).toBe(
      INSTALLATION
    );
    expect(currentSeasonRows(state())[0].finished).toBe(true);
  });

  it('makes a finished Season read only', async () => {
    await openWithSeason();
    await openSeason(SEASON);
    finishSeason(SEASON);
    expect(() => requireRunningSeason(state().seasons[SEASON])).toThrow(
      'The Season "Liga Norte" (2026-27) is finished. Reopen it to change it.'
    );
    expect(() => finishSeason(SEASON)).toThrow('is finished');
  });

  it('reopens a finished Season', async () => {
    await openWithSeason();
    await openSeason(SEASON);
    finishSeason(SEASON);
    reopenSeason(SEASON);
    expect(state().seasons[SEASON].content.finished).toBe(false);
    expect(() => requireRunningSeason(state().seasons[SEASON])).not.toThrow();
  });

  it('throws for a Season that is not open', async () => {
    await openWithSeason();
    expect(() => finishSeason(SEASON)).toThrow(
      `No open Season has the UUID ${SEASON}.`
    );
  });
});

describe('deleteSeason (US-13.2, Task 210)', () => {
  it('takes the Season and its row away, and keeps the Blueprints', async () => {
    await openWithSeason();
    await openSeason(SEASON);
    deleteSeason(SEASON);
    expect(state().seasons[SEASON]).toBeUndefined();
    expect(currentSeasonRows(state())).toEqual([]);
    expect(state().blueprints).toEqual([blueprint()]);
    expect(isDatabaseUnsaved(state())).toBe(true);
  });

  it('deletes a finished Season', async () => {
    await openWithSeason();
    await openSeason(SEASON);
    finishSeason(SEASON);
    deleteSeason(SEASON);
    expect(currentSeasonRows(state())).toEqual([]);
  });

  it('deletes a Season that is not open', async () => {
    await openWithSeason();
    deleteSeason(SEASON);
    expect(currentSeasonRows(state())).toEqual([]);
  });
});

describe('the Season save (Task 210 choices 6 and 8)', () => {
  it('writes a new Season and its row, and marks it saved', async () => {
    const memory = await openWithSeason();
    const season = createSeason({ name: 'Copa', year: '1' });
    await saveDatabase();

    expect(memory.saves[0].wrappers.map((w) => w.uuid)).toEqual([season.uuid]);
    expect(parseSeasonWrapper(memory.files.wrappers[season.uuid])).toEqual(season);
    expect(
      parseManifestRecord(memory.files.manifest ?? '').seasons.map((row) => row.name)
    ).toEqual(['Liga Norte', 'Copa']);
    expect(isDatabaseUnsaved(state())).toBe(false);
  });

  it('removes the file and the row of a deleted Season', async () => {
    const memory = await openWithSeason();
    deleteSeason(SEASON);
    await saveDatabase();

    expect(memory.saves[0].removed).toEqual([SEASON]);
    expect(memory.files.wrappers[SEASON]).toBeUndefined();
    expect(parseManifestRecord(memory.files.manifest ?? '').seasons).toEqual([]);
    expect(isDatabaseUnsaved(state())).toBe(false);
  });

  it('removes no file for a new Season deleted before a save', async () => {
    const memory = await openWithSeason();
    const season = createSeason({ name: 'Copa', year: '1' });
    deleteSeason(season.uuid);
    expect(isDatabaseUnsaved(state())).toBe(false);
    await saveDatabase();
    expect(memory.saves).toEqual([]);
  });

  it('puts the unsaved changes of an open Season in the database export', async () => {
    await openWithSeason();
    await renameSeason(SEASON, { name: 'Liga do Norte', year: '2026-27' });
    const bundle = unpackDatabaseZip(await exportDatabaseZip());
    expect(parseSeasonWrapper(bundle.seasons[0].contents).content.name).toBe(
      'Liga do Norte'
    );
  });
});

/** Five Blueprints for the roster tests: two Ashfield Rovers, from two
 * places, and three teams with their own names. */
const ASHFIELD = blueprint({
  uuid: testUuid(1),
  slug: 'ashfield-rovers',
  name: 'Ashfield Rovers',
  tier: 'A',
  location: 'Ashfield',
  trigrams: ['ASH'],
});
const WESTBURY = blueprint({
  uuid: testUuid(2),
  slug: 'ashfield-rovers-2',
  name: 'Ashfield Rovers',
  tier: 'B',
  location: 'Westbury',
  trigrams: ['ASH', 'ASW'],
});
const RIVERSIDE = blueprint({
  uuid: testUuid(3),
  slug: 'riverside-fc',
  name: 'Riverside FC',
  tier: 'C',
  location: '',
  trigrams: [],
});
const RIVERSIDE_TOO = blueprint({
  uuid: testUuid(4),
  slug: 'riverside-fc-2',
  name: 'Riverside FC',
  tier: 'D',
  location: '',
  trigrams: [],
});
const PORTO = blueprint({
  uuid: testUuid(5),
  slug: 'porto-velho',
  name: 'Porto Velho',
  tier: 'S',
  location: 'Porto',
  trigrams: ['ASH', 'POR'],
});

/** An open database with the five Blueprints and one new, empty Season. */
async function openWithEmptySeason(): Promise<string> {
  const blueprints: TeamBlueprint[] = [
    ASHFIELD,
    WESTBURY,
    RIVERSIDE,
    RIVERSIDE_TOO,
    PORTO,
  ];
  const memory = memoryFolder({
    manifest: serializeManifestRecord({
      installationUuid: INSTALLATION,
      blueprints,
      wrappers: [],
      seasons: [],
    }),
  });
  await openDatabase(memory.folder);
  return createSeason({ name: 'Liga Norte', year: '2026' }).uuid;
}

const roster = (uuid: string): TeamInstance[] => state().seasons[uuid].teams;
const namesOf = (uuid: string): Record<string, string> =>
  Object.fromEntries(roster(uuid).map((team) => [team.blueprintUuid, team.name]));
const trigramsOf = (uuid: string): Record<string, string> =>
  Object.fromEntries(roster(uuid).map((team) => [team.blueprintUuid, team.trigram]));

describe('addSeasonTeams (US-13.4, Task 211)', () => {
  it('adds a Season team for each Blueprint, in order, with a rolled OVR', async () => {
    const season = await openWithEmptySeason();
    const added = addSeasonTeams(
      season,
      [RIVERSIDE.uuid, ASHFIELD.uuid],
      createSeededRng(7)
    );

    expect(roster(season)).toEqual(added);
    expect(added.map((team) => team.blueprintUuid)).toEqual([
      RIVERSIDE.uuid,
      ASHFIELD.uuid,
    ]);
    expect(added[1]).toMatchObject({
      slug: 'ashfield-rovers',
      name: 'Ashfield Rovers',
      colour: ASHFIELD.colour,
      tier: 'A',
    });
    expect(added.every((team) => isOvrInTier(team.ovr, team.tier))).toBe(true);
    expect(currentSeasonRows(state())[0].teamCount).toBe(2);
    expect(isSeasonUnsaved(state(), season)).toBe(true);
  });

  it('gives the first batch its trigrams by the higher OVR', async () => {
    const season = await openWithEmptySeason();
    addSeasonTeams(season, [WESTBURY.uuid, ASHFIELD.uuid, PORTO.uuid]);
    expect(trigramsOf(season)).toEqual({
      [PORTO.uuid]: 'ASH',
      [ASHFIELD.uuid]: 'AS2',
      [WESTBURY.uuid]: 'ASW',
    });
  });

  it('gives a later join a free trigram, and keeps each picked trigram', async () => {
    const season = await openWithEmptySeason();
    addSeasonTeams(season, [ASHFIELD.uuid]);
    addSeasonTeams(season, [PORTO.uuid]);
    expect(trigramsOf(season)).toEqual({ [ASHFIELD.uuid]: 'ASH', [PORTO.uuid]: 'POR' });
  });

  it('adds the Location to a joining team whose name a roster team has', async () => {
    const season = await openWithEmptySeason();
    addSeasonTeams(season, [WESTBURY.uuid]);
    addSeasonTeams(season, [ASHFIELD.uuid]);
    expect(namesOf(season)).toEqual({
      [WESTBURY.uuid]: 'Ashfield Rovers',
      [ASHFIELD.uuid]: 'Ashfield Rovers (Ashfield)',
    });
  });

  it('lets the higher OVR keep the name in one join, and numbers a team with no Location', async () => {
    const season = await openWithEmptySeason();
    addSeasonTeams(season, [
      WESTBURY.uuid,
      ASHFIELD.uuid,
      RIVERSIDE_TOO.uuid,
      RIVERSIDE.uuid,
    ]);
    expect(namesOf(season)).toEqual({
      [ASHFIELD.uuid]: 'Ashfield Rovers',
      [WESTBURY.uuid]: 'Ashfield Rovers (Westbury)',
      [RIVERSIDE.uuid]: 'Riverside FC',
      [RIVERSIDE_TOO.uuid]: 'Riverside FC (2)',
    });
  });

  it('keeps the slug of the Blueprint for a team with a new name', async () => {
    const season = await openWithEmptySeason();
    addSeasonTeams(season, [ASHFIELD.uuid, WESTBURY.uuid]);
    expect(roster(season)[1].slug).toBe('ashfield-rovers-2');
  });

  it('skips a Blueprint that is in the roster, and gives only the new teams (choice 2)', async () => {
    const season = await openWithEmptySeason();
    const [first] = addSeasonTeams(season, [ASHFIELD.uuid]);
    const added = addSeasonTeams(season, [ASHFIELD.uuid, RIVERSIDE.uuid]);
    expect(added.map((team) => team.blueprintUuid)).toEqual([RIVERSIDE.uuid]);
    expect(roster(season)[0]).toBe(first);
  });

  it('changes nothing for an empty list', async () => {
    const season = await openWithEmptySeason();
    const before = state().seasons[season];
    expect(addSeasonTeams(season, [])).toEqual([]);
    expect(state().seasons[season]).toBe(before);
  });

  it('throws for an unknown Blueprint, and adds nothing', async () => {
    const season = await openWithEmptySeason();
    expect(() => addSeasonTeams(season, [RIVERSIDE.uuid, testUuid(99)])).toThrow(
      `No Blueprint has the UUID ${testUuid(99)}.`
    );
    expect(roster(season)).toEqual([]);
  });

  it('throws for a finished Season', async () => {
    const season = await openWithEmptySeason();
    finishSeason(season);
    expect(() => addSeasonTeams(season, [RIVERSIDE.uuid])).toThrow('is finished');
  });
});

describe('updateSeasonTeam (US-13.4, Task 211)', () => {
  async function openWithRoster(): Promise<string> {
    const season = await openWithEmptySeason();
    addSeasonTeams(season, [ASHFIELD.uuid, RIVERSIDE.uuid]);
    return season;
  }

  it('changes the name, the colour, the Tier, the OVR, and the trigram', async () => {
    const season = await openWithRoster();
    updateSeasonTeam(season, ASHFIELD.uuid, {
      name: ' Ashfield Town ',
      colour: '#000000',
      tier: 'S',
      ovr: 95,
      trigram: 'atw',
    });
    expect(roster(season)[0]).toMatchObject({
      blueprintUuid: ASHFIELD.uuid,
      slug: 'ashfield-rovers',
      name: 'Ashfield Town',
      colour: '#000000',
      tier: 'S',
      ovr: 95,
      trigram: 'ATW',
    });
    expect(state().seasons[season].content.lastModifiedByInstallation).toBe(
      INSTALLATION
    );
  });

  it('keeps the fields that the change leaves out', async () => {
    const season = await openWithRoster();
    const before = roster(season)[0];
    updateSeasonTeam(season, ASHFIELD.uuid, { colour: '#000000' });
    expect(roster(season)[0]).toEqual({ ...before, colour: '#000000' });
  });

  it('reaches each league of the Season: they share the one Season team', async () => {
    const season = await openWithRoster();
    updateSeasonTeam(season, RIVERSIDE.uuid, { ovr: 61 });
    expect(
      roster(season).find((team) => team.blueprintUuid === RIVERSIDE.uuid)?.ovr
    ).toBe(61);
  });

  it('takes a change of case of its own name', async () => {
    const season = await openWithRoster();
    updateSeasonTeam(season, ASHFIELD.uuid, { name: 'ASHFIELD ROVERS' });
    expect(roster(season)[0].name).toBe('ASHFIELD ROVERS');
  });

  it('throws for a blank name, or the name of another Season team', async () => {
    const season = await openWithRoster();
    expect(() => updateSeasonTeam(season, ASHFIELD.uuid, { name: ' ' })).toThrow(
      'A Season team needs a name.'
    );
    expect(() =>
      updateSeasonTeam(season, ASHFIELD.uuid, { name: 'riverside fc' })
    ).toThrow('Another Season team has the name "riverside fc".');
  });

  it('throws for an OVR out of the Tier range', async () => {
    const season = await openWithRoster();
    expect(() =>
      updateSeasonTeam(season, ASHFIELD.uuid, { tier: 'S', ovr: 50 })
    ).toThrow('The OVR 50 is not in the range of Tier S.');
  });

  it('throws for a trigram that is not valid, or that another Season team has', async () => {
    const season = await openWithRoster();
    expect(() => updateSeasonTeam(season, ASHFIELD.uuid, { trigram: 'AB' })).toThrow(
      'The trigram "AB" is not 3 letters or digits.'
    );
    expect(() => updateSeasonTeam(season, ASHFIELD.uuid, { trigram: 'riv' })).toThrow(
      'Another Season team has the trigram "RIV".'
    );
  });

  it('throws for a team that is not in the roster', async () => {
    const season = await openWithRoster();
    expect(() => updateSeasonTeam(season, PORTO.uuid, { ovr: 95 })).toThrow(
      `The Season has no team with the Blueprint UUID ${PORTO.uuid}.`
    );
  });

  it('throws for a finished Season', async () => {
    const season = await openWithRoster();
    finishSeason(season);
    expect(() => updateSeasonTeam(season, ASHFIELD.uuid, { ovr: 85 })).toThrow(
      'is finished'
    );
  });
});
