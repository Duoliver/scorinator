import { beforeEach, describe, expect, it } from 'vitest';
import { createSeededRng } from '@/engine/rng';
import { playTie, type TieRules } from '@/engine/tiebreak';
import type { SeasonWrapper } from '@/domain';
import {
  blueprint,
  HARBORVIEW,
  INSTALLATION,
  memoryFolder,
  SALT_MARSH,
  SEASON,
  seasonRow,
  seasonWrapper,
  testUuid,
} from '@/test/databaseRecords';
import {
  parseSeasonWrapper,
  serializeManifestRecord,
  serializeSeasonWrapper,
} from '@/app/data/databaseFile';
import { openDatabase, saveDatabase } from './databaseActions';
import {
  isPlayoffNameTaken,
  isSeasonUnsaved,
  useDatabaseStore,
  type DatabaseState,
} from './databaseStore';
import { finishSeason, openSeason, updateSeasonTeam } from './seasonActions';
import { createPlayoff, playPlayoff, type PlayoffInput } from './seasonPlayoffActions';

const state = (): DatabaseState => useDatabaseStore.getState();
const season = (): SeasonWrapper => state().seasons[SEASON];
const OTHER_INSTALLATION = '00000000-0000-4000-8000-0000000000ff';
const PLAYOFF = '09090909-0909-4909-8909-090909090909';
const bytes =
  (fill: number) =>
  (length: number): Uint8Array =>
    new Uint8Array(length).fill(fill);

const TWO_LEGS: TieRules = {
  format: 'two-legged',
  awayGoals: true,
  playsAet: true,
  method: 'penalties',
  homeAdvantage: true,
};
const ONE_MATCH: TieRules = { ...TWO_LEGS, format: 'single-match', awayGoals: false };

function input(overrides: Partial<PlayoffInput> = {}): PlayoffInput {
  return {
    name: 'Supertaça',
    team1Uuid: SALT_MARSH,
    team2Uuid: HARBORVIEW,
    rules: TWO_LEGS,
    ...overrides,
  };
}

/** An open database with the test Season open and saved: two Season teams,
 * made by another installation, and no playoff. */
async function openWithSeason(): Promise<ReturnType<typeof memoryFolder>> {
  const saved = seasonWrapper();
  saved.content.createdByInstallation = OTHER_INSTALLATION;
  saved.content.lastModifiedByInstallation = OTHER_INSTALLATION;
  const memory = memoryFolder({
    manifest: serializeManifestRecord({
      installationUuid: INSTALLATION,
      blueprints: [blueprint(), blueprint({ uuid: HARBORVIEW, slug: 'harborview-sc' })],
      wrappers: [],
      seasons: [seasonRow()],
    }),
    wrappers: { [SEASON]: serializeSeasonWrapper(saved) },
  });
  await openDatabase(memory.folder);
  await openSeason(SEASON);
  return memory;
}

beforeEach(() => {
  useDatabaseStore.setState(useDatabaseStore.getInitialState(), true);
});

describe('createPlayoff (US-13.7, Task 217)', () => {
  it('adds a playoff with no result to the Season, unsaved and stamped', async () => {
    await openWithSeason();
    const roster = season().teams;

    const playoff = createPlayoff(SEASON, input({ name: '  Supertaça ' }), bytes(9));

    expect(playoff).toEqual({
      uuid: PLAYOFF,
      name: 'Supertaça',
      team1Uuid: SALT_MARSH,
      team2Uuid: HARBORVIEW,
      rules: TWO_LEGS,
    });
    expect(season().content.playoffs).toEqual([playoff]);
    expect(season().content.lastModifiedByInstallation).toBe(INSTALLATION);
    expect(season().teams).toBe(roster);
    expect(isSeasonUnsaved(state(), SEASON)).toBe(true);
  });

  it('stores the away goals rule as off for a single match (choice 2)', async () => {
    await openWithSeason();

    const playoff = createPlayoff(
      SEASON,
      input({ rules: { ...ONE_MATCH, awayGoals: true } })
    );

    expect(playoff.rules.awayGoals).toBe(false);
  });

  it('keeps each name once in the Season, in any case', async () => {
    await openWithSeason();
    const first = createPlayoff(SEASON, input());

    expect(isPlayoffNameTaken(season(), ' SUPERTAÇA ')).toBe(true);
    expect(isPlayoffNameTaken(season(), 'Supertaça', first.uuid)).toBe(false);
    expect(isPlayoffNameTaken(season(), 'Taça de Honra')).toBe(false);
  });

  it.each([
    ['a blank name', input({ name: '  ' })],
    ['a taken name', input({ name: 'supertaça' })],
    ['the same team twice', input({ team2Uuid: SALT_MARSH })],
    ['a team that is not in the roster', input({ team2Uuid: testUuid(9) })],
  ])('throws a RangeError for %s, and changes nothing', async (_case, bad) => {
    await openWithSeason();
    createPlayoff(SEASON, input());
    const before = season();

    expect(() => createPlayoff(SEASON, bad)).toThrow(RangeError);
    expect(season()).toBe(before);
  });

  it('throws for a finished Season, and changes nothing (US-13.9)', async () => {
    await openWithSeason();
    finishSeason(SEASON);
    const before = season();

    expect(() => createPlayoff(SEASON, input())).toThrow(/finished/);
    expect(season()).toBe(before);
  });

  it('throws for a Season that is not open', async () => {
    await openWithSeason();

    expect(() => createPlayoff(testUuid(9), input())).toThrow(RangeError);
  });
});

describe('playPlayoff (US-13.7, Task 217)', () => {
  it('plays the tie with the current Season teams, Team 1 at home in the first leg', async () => {
    await openWithSeason();
    updateSeasonTeam(SEASON, SALT_MARSH, { ovr: 79 });
    const { uuid } = createPlayoff(SEASON, input());

    playPlayoff(SEASON, uuid, createSeededRng(7));

    // Team 2 is the "higher seed" of the engine: it plays the second leg
    // at home (choice 4).
    const expected = playTie(
      { id: HARBORVIEW, ovr: 63 },
      { id: SALT_MARSH, ovr: 79 },
      TWO_LEGS,
      createSeededRng(7)
    );
    const [playoff] = season().content.playoffs;
    expect(playoff.result).toEqual(expected);
    expect(playoff.result?.matches[0]).toMatchObject({
      part: 'leg1',
      homeId: SALT_MARSH,
      awayId: HARBORVIEW,
    });
    expect(playoff.result?.matches[1]).toMatchObject({
      part: 'leg2',
      homeId: HARBORVIEW,
    });
  });

  it('puts Team 1 in the home slot of a single match, at a neutral venue (choice 3, option A)', async () => {
    await openWithSeason();
    const { uuid } = createPlayoff(SEASON, input({ rules: ONE_MATCH }));

    playPlayoff(SEASON, uuid, createSeededRng(3));

    const expected = playTie(
      { id: SALT_MARSH, ovr: 74 },
      { id: HARBORVIEW, ovr: 63 },
      ONE_MATCH,
      createSeededRng(3)
    );
    const [playoff] = season().content.playoffs;
    expect(playoff.result).toEqual(expected);
    expect(playoff.result?.matches[0].homeId).toBe(SALT_MARSH);
  });

  it('stamps the Season and makes it unsaved', async () => {
    await openWithSeason();
    const { uuid } = createPlayoff(SEASON, input());
    // Saved, as another installation left it.
    const saved: SeasonWrapper = {
      ...season(),
      content: { ...season().content, lastModifiedByInstallation: OTHER_INSTALLATION },
    };
    useDatabaseStore.setState({
      seasons: { [SEASON]: saved },
      savedSeasons: { [SEASON]: saved },
    });

    playPlayoff(SEASON, uuid);

    expect(season().content.lastModifiedByInstallation).toBe(INSTALLATION);
    expect(isSeasonUnsaved(state(), SEASON)).toBe(true);
  });

  it('throws for a played playoff, and changes nothing (choice 6, future features §41)', async () => {
    await openWithSeason();
    const { uuid } = createPlayoff(SEASON, input());
    playPlayoff(SEASON, uuid);
    const before = season();

    expect(() => playPlayoff(SEASON, uuid)).toThrow(RangeError);
    expect(season()).toBe(before);
  });

  it('throws for a finished Season, and changes nothing (US-13.9)', async () => {
    await openWithSeason();
    const { uuid } = createPlayoff(SEASON, input());
    finishSeason(SEASON);
    const before = season();

    expect(() => playPlayoff(SEASON, uuid)).toThrow(/finished/);
    expect(season()).toBe(before);
  });

  it('throws a RangeError for an unknown playoff', async () => {
    await openWithSeason();

    expect(() => playPlayoff(SEASON, testUuid(9))).toThrow(RangeError);
  });

  it('a save writes the playoff and its result to the Season file', async () => {
    const memory = await openWithSeason();
    const { uuid } = createPlayoff(SEASON, input());
    playPlayoff(SEASON, uuid);

    await saveDatabase();

    const saved = parseSeasonWrapper(memory.files.wrappers[SEASON]);
    expect(saved.content.playoffs).toEqual(season().content.playoffs);
    expect(isSeasonUnsaved(state(), SEASON)).toBe(false);
  });
});
