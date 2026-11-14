import { beforeEach, describe, expect, it } from 'vitest';
import type { PlanZone } from '@/engine/phases';
import type { SeasonWrapper, TeamInstance } from '@/domain';
import {
  blueprint,
  HARBORVIEW,
  INSTALLATION,
  instance,
  LEAGUE,
  leagueWrapper,
  memoryFolder,
  OTHER_LEAGUE,
  SALT_MARSH,
  scheduled,
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
  findLeagueWrapper,
  isSeasonUnsaved,
  useDatabaseStore,
  type DatabaseState,
  type SeasonLeagueRef,
} from './databaseStore';
import {
  rescorinateFixture,
  scorinateBracket,
  scorinateFixture,
  scorinateMatchday,
  setPhaseZones,
  startNextPhase,
} from './leagueWrapperActions';
import { finishSeason, openSeason, updateSeasonTeam } from './seasonActions';
import { createSeasonLeague } from './seasonLeagueActions';

const state = (): DatabaseState => useDatabaseStore.getState();
const season = (): SeasonWrapper => state().seasons[SEASON];
const OTHER_INSTALLATION = '00000000-0000-4000-8000-0000000000ff';
const TOWN = testUuid(40);
const NAMESAKE = testUuid(41);
const REF: SeasonLeagueRef = { seasonUuid: SEASON, leagueUuid: LEAGUE };
const bytes =
  (fill: number) =>
  (length: number): Uint8Array =>
    new Uint8Array(length).fill(fill);
const NEW_LEAGUE = '09090909-0909-4909-8909-090909090909';

const blueprints = [
  blueprint(),
  blueprint({
    uuid: HARBORVIEW,
    slug: 'harborview-sc',
    name: 'Harborview SC',
    tier: 'C',
  }),
  blueprint({
    uuid: TOWN,
    slug: 'old-town',
    name: 'Old Town',
    tier: 'F',
    location: '',
    trigrams: [],
  }),
  // A second "Salt Marsh United", from another place (Task 208).
  blueprint({
    uuid: NAMESAKE,
    slug: 'salt-marsh-united-2',
    name: 'Salt Marsh United',
    location: 'Northtown',
    trigrams: ['SMU'],
  }),
];

/** The Instance that the wizard gives for a Blueprint from outside the
 * Season: its OVR rolled at the add (Task 215, round 7). */
function wizardTeam(uuid: string, overrides: Partial<TeamInstance> = {}): TeamInstance {
  const source = blueprints.find((candidate) => candidate.uuid === uuid);
  if (!source) throw new Error(`The test has no Blueprint ${uuid}.`);
  return instance({
    blueprintUuid: uuid,
    slug: source.slug,
    name: source.name,
    colour: source.colour,
    tier: source.tier,
    ovr: source.tier === 'F' ? 35 : 74,
    trigram: '',
    ...overrides,
  });
}

/** An open database with the test Season open and saved: two Season teams,
 * one league of both, made by another installation. */
async function openWithSeason(): Promise<ReturnType<typeof memoryFolder>> {
  const saved = seasonWrapper();
  saved.content.createdByInstallation = OTHER_INSTALLATION;
  saved.content.lastModifiedByInstallation = OTHER_INSTALLATION;
  saved.content.leagues[0].createdByInstallation = OTHER_INSTALLATION;
  saved.content.leagues[0].lastModifiedByInstallation = OTHER_INSTALLATION;
  const memory = memoryFolder({
    manifest: serializeManifestRecord({
      installationUuid: INSTALLATION,
      blueprints,
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

describe('findLeagueWrapper (Task 216 choices 1 and 3)', () => {
  it('gives a standalone league by its UUID', async () => {
    await openWithSeason();
    const wrapper = leagueWrapper();
    useDatabaseStore.setState({ leagues: { [LEAGUE]: wrapper } });

    expect(findLeagueWrapper(state(), LEAGUE)).toBe(wrapper);
  });

  it('gives a Season league with the Season teams of its teamUuids, in that order', async () => {
    await openWithSeason();
    const [league] = season().content.leagues;
    useDatabaseStore.setState((now) => ({
      seasons: {
        [SEASON]: {
          ...now.seasons[SEASON],
          content: {
            ...now.seasons[SEASON].content,
            leagues: [{ ...league, teamUuids: [HARBORVIEW, SALT_MARSH] }],
          },
        },
      },
    }));

    const view = findLeagueWrapper(state(), REF);

    expect(view?.uuid).toBe(LEAGUE);
    expect(view?.teams).toEqual([season().teams[1], season().teams[0]]);
    expect(view?.content).not.toHaveProperty('teamUuids');
    expect(view?.content.phases).toBe(league.phases);
  });

  it('gives the same object until the league or the roster changes', async () => {
    await openWithSeason();
    const first = findLeagueWrapper(state(), REF);

    expect(findLeagueWrapper(state(), REF)).toBe(first);
    updateSeasonTeam(SEASON, SALT_MARSH, { ovr: 79 });
    const edited = findLeagueWrapper(state(), REF);
    expect(edited).not.toBe(first);
    expect(edited?.teams[0].ovr).toBe(79);
  });

  it('keeps a Season league apart from a standalone league with the same UUID', async () => {
    await openWithSeason();
    const standalone = leagueWrapper();
    useDatabaseStore.setState({ leagues: { [LEAGUE]: standalone } });

    expect(findLeagueWrapper(state(), REF)).not.toBe(standalone);
    expect(findLeagueWrapper(state(), REF)?.teams[1].trigram).toBe('HAR');
  });

  it('gives undefined for a Season that is not open, or an unknown league', async () => {
    await openWithSeason();

    expect(
      findLeagueWrapper(state(), { seasonUuid: testUuid(9), leagueUuid: LEAGUE })
    ).toBeUndefined();
    expect(
      findLeagueWrapper(state(), { seasonUuid: SEASON, leagueUuid: OTHER_LEAGUE })
    ).toBeUndefined();
    expect(findLeagueWrapper(state(), OTHER_LEAGUE)).toBeUndefined();
  });
});

describe('createSeasonLeague (US-13.5, Task 216 choice 5)', () => {
  it('adds a league of Season teams to the Season, unsaved and stamped', async () => {
    await openWithSeason();
    const roster = season().teams;

    const view = createSeasonLeague(
      SEASON,
      {
        name: 'Taça Norte',
        homeAdvantage: false,
        points: { win: 3, draw: 1, loss: 0 },
        teams: roster,
      },
      bytes(9)
    );

    const { leagues } = season().content;
    expect(leagues).toHaveLength(2);
    expect(leagues[1]).toMatchObject({
      uuid: NEW_LEAGUE,
      name: 'Taça Norte',
      teamUuids: [SALT_MARSH, HARBORVIEW],
      createdByInstallation: INSTALLATION,
      lastModifiedByInstallation: INSTALLATION,
    });
    expect(scheduled(leagues[1].phases[0]).fixtures).toHaveLength(2);
    expect(season().content.lastModifiedByInstallation).toBe(INSTALLATION);
    expect(season().teams).toBe(roster);
    expect(isSeasonUnsaved(state(), SEASON)).toBe(true);
    expect(view).toBe(
      findLeagueWrapper(state(), { seasonUuid: SEASON, leagueUuid: NEW_LEAGUE })
    );
    expect(state().leagues).toEqual({});
  });

  it('plays a Season team as the roster has it, not as the input has it', async () => {
    await openWithSeason();
    const teams = season().teams.map((team) => ({ ...team, ovr: 99, name: 'Typo' }));

    const view = createSeasonLeague(
      SEASON,
      {
        name: 'Taça Norte',
        homeAdvantage: false,
        points: { win: 3, draw: 1, loss: 0 },
        teams,
      },
      bytes(9)
    );

    expect(view.teams).toEqual(season().teams);
  });

  it('lets a Blueprint from outside join the roster, with the OVR and Tier of the wizard', async () => {
    await openWithSeason();
    const town = wizardTeam(TOWN, { tier: 'E', ovr: 44 });

    const view = createSeasonLeague(
      SEASON,
      {
        name: 'Taça Norte',
        homeAdvantage: false,
        points: { win: 3, draw: 1, loss: 0 },
        teams: [season().teams[0], town],
      },
      bytes(9)
    );

    const joined = season().teams[2];
    expect(season().teams).toHaveLength(3);
    expect(joined).toMatchObject({
      blueprintUuid: TOWN,
      name: 'Old Town',
      tier: 'E',
      ovr: 44,
    });
    expect(joined.trigram).toMatch(/^[A-Z0-9]{3}$/);
    expect(['SMU', 'HAR']).not.toContain(joined.trigram);
    expect(season().content.leagues[1].teamUuids).toEqual([SALT_MARSH, TOWN]);
    expect(view.teams[1]).toBe(joined);
  });

  it('gives a joining team with a Season name its Location, and a free trigram (Task 208)', async () => {
    await openWithSeason();

    createSeasonLeague(
      SEASON,
      {
        name: 'Taça Norte',
        homeAdvantage: false,
        points: { win: 3, draw: 1, loss: 0 },
        teams: [season().teams[1], wizardTeam(NAMESAKE)],
      },
      bytes(9)
    );

    expect(season().teams[2].name).toBe('Salt Marsh United (Northtown)');
    expect(season().teams[2].trigram).not.toBe('SMU');
  });

  it('keeps the fixed trigram of a joining team', async () => {
    await openWithSeason();

    createSeasonLeague(
      SEASON,
      {
        name: 'Taça Norte',
        homeAdvantage: false,
        points: { win: 3, draw: 1, loss: 0 },
        teams: [season().teams[0], wizardTeam(TOWN)],
        fixedTrigrams: { [TOWN]: 'olt' },
      },
      bytes(9)
    );

    expect(season().teams[2].trigram).toBe('OLT');
  });

  it.each([
    ['a joining OVR outside its Tier', { teams: 'outside-tier' }],
    ['a fixed trigram of a Season team', { teams: 'taken-trigram' }],
    ['one team only, a plan problem', { teams: 'one' }],
    ['a team twice', { teams: 'twice' }],
  ])('throws a RangeError for %s, and changes nothing', async (_case, { teams }) => {
    await openWithSeason();
    const before = season();
    const [smu] = before.teams;
    const lists: Record<string, TeamInstance[]> = {
      'outside-tier': [smu, wizardTeam(TOWN, { ovr: 90 })],
      'taken-trigram': [smu, wizardTeam(TOWN)],
      one: [wizardTeam(TOWN)],
      twice: [smu, smu],
    };

    expect(() =>
      createSeasonLeague(SEASON, {
        name: 'Taça Norte',
        homeAdvantage: false,
        points: { win: 3, draw: 1, loss: 0 },
        teams: lists[teams],
        fixedTrigrams: teams === 'taken-trigram' ? { [TOWN]: 'HAR' } : undefined,
      })
    ).toThrow(RangeError);
    expect(season()).toBe(before);
  });

  it('throws for a finished Season, and changes nothing (US-13.9)', async () => {
    await openWithSeason();
    finishSeason(SEASON);
    const before = season();

    expect(() =>
      createSeasonLeague(SEASON, {
        name: 'Taça Norte',
        homeAdvantage: false,
        points: { win: 3, draw: 1, loss: 0 },
        teams: before.teams,
      })
    ).toThrow(/finished/);
    expect(season()).toBe(before);
  });

  it('throws for a Season that is not open', async () => {
    await openWithSeason();

    expect(() =>
      createSeasonLeague(testUuid(9), {
        name: 'Taça Norte',
        homeAdvantage: false,
        points: { win: 3, draw: 1, loss: 0 },
        teams: season().teams,
      })
    ).toThrow(RangeError);
  });
});

describe('the league actions on a Season league (US-13.5, US-13.6, Task 216 choices 4 and 7)', () => {
  it('plays a matchday, and stamps the league and the Season', async () => {
    await openWithSeason();
    const roster = season().teams;

    scorinateMatchday(REF, 1);

    const [league] = season().content.leagues;
    expect(league.phases[0].results).toHaveLength(1);
    expect(league.teamUuids).toEqual([SALT_MARSH, HARBORVIEW]);
    expect(league.lastModifiedByInstallation).toBe(INSTALLATION);
    expect(season().content.lastModifiedByInstallation).toBe(INSTALLATION);
    expect(season().teams).toBe(roster);
    expect(isSeasonUnsaved(state(), SEASON)).toBe(true);
    expect(state().leagues).toEqual({});
  });

  it('plays a fixture and plays it again', async () => {
    await openWithSeason();

    scorinateFixture(REF, 'p1.g1.md2.m1');
    const [first] = scheduled(season().content.leagues[0].phases[0]).results;
    rescorinateFixture(REF, 'p1.g1.md2.m1');

    const { results } = scheduled(season().content.leagues[0].phases[0]);
    expect(first.fixtureId).toBe('p1.g1.md2.m1');
    expect(results).toHaveLength(1);
    expect(results[0]).not.toBe(first);
  });

  it('runs two leagues in parallel with a shared team, and one never changes the other', async () => {
    await openWithSeason();
    createSeasonLeague(
      SEASON,
      {
        name: 'Taça Norte',
        homeAdvantage: false,
        points: { win: 3, draw: 1, loss: 0 },
        teams: [season().teams[0], wizardTeam(TOWN)],
      },
      bytes(9)
    );
    const cup = season().content.leagues[1];

    scorinateMatchday(REF, 1);
    scorinateMatchday(REF, 2);

    expect(season().content.leagues[1]).toBe(cup);
    expect(cup.teamUuids).toContain(SALT_MARSH);
    expect(season().content.leagues[0].teamUuids).toContain(SALT_MARSH);
  });

  it('sets the zones of a Season league', async () => {
    await openWithSeason();
    const zones: PlanZone[] = [
      { colour: 'red', label: 'Out', places: { from: 2, to: 2 } },
    ];

    setPhaseZones(REF, 0, zones);

    expect(season().content.leagues[0].plans[0]).toMatchObject({ zones });
  });

  it('plays a bracket of a Season league', async () => {
    await openWithSeason();
    createSeasonLeague(
      SEASON,
      {
        name: 'Taça Norte',
        homeAdvantage: false,
        points: { win: 3, draw: 1, loss: 0 },
        teams: season().teams,
        plans: [{ format: 'bracket' }],
      },
      bytes(9)
    );

    scorinateBracket({ seasonUuid: SEASON, leagueUuid: NEW_LEAGUE });

    expect(season().content.leagues[1].phases[0].results).toHaveLength(1);
  });

  it.each([
    ['scorinateFixture', (): void => scorinateFixture(REF, 'p1.g1.md1.m1')],
    ['scorinateMatchday', (): void => scorinateMatchday(REF, 1)],
    ['startNextPhase', (): void => startNextPhase(REF)],
    [
      'setPhaseZones',
      (): void =>
        setPhaseZones(REF, 0, [
          { colour: 'red', label: 'Out', places: { from: 2, to: 2 } },
        ]),
    ],
  ])(
    '%s throws for a finished Season, and changes nothing (US-13.9)',
    async (_name, act) => {
      await openWithSeason();
      finishSeason(SEASON);
      const before = season();

      expect(act).toThrow(/finished/);
      expect(season()).toBe(before);
    }
  );

  it('throws a RangeError for a league that the Season does not have', async () => {
    await openWithSeason();

    expect(() =>
      scorinateMatchday({ seasonUuid: SEASON, leagueUuid: OTHER_LEAGUE }, 1)
    ).toThrow(RangeError);
  });

  it('a save writes the Season file with the results', async () => {
    const memory = await openWithSeason();
    scorinateMatchday(REF, 1);

    await saveDatabase();

    const saved = parseSeasonWrapper(memory.files.wrappers[SEASON]);
    expect(saved.content.leagues[0].phases[0].results).toHaveLength(1);
    expect(isSeasonUnsaved(state(), SEASON)).toBe(false);
  });
});
