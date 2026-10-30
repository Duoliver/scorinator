import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Phase } from '@/domain';
import { isUuidV4 } from '@/engine/identity';
import {
  blueprint,
  HARBORVIEW,
  INSTALLATION,
  instance,
  leagueWrapper,
  LEAGUE,
  memoryFolder,
  result,
  SALT_MARSH,
} from '@/test/databaseRecords';
import { serializeManifestRecord } from '@/app/data/databaseFile';
import { openDatabase } from './databaseActions';
import { isLeagueUnsaved, useDatabaseStore, type DatabaseState } from './databaseStore';
import {
  createLeague,
  rescorinateFixture,
  scorinateFixture,
  scorinateMatchday,
} from './leagueWrapperActions';

const OTHER_INSTALLATION = '00000000-0000-4000-8000-0000000000ff';
const TOWN = '00000000-0000-4000-8000-0000000000a3';
const state = (): DatabaseState => useDatabaseStore.getState();

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
    colour: '#000000',
  }),
];

async function open(): Promise<void> {
  const manifest = serializeManifestRecord({
    installationUuid: INSTALLATION,
    blueprints,
    wrappers: [],
  });
  await openDatabase(memoryFolder({ manifest }).folder);
}

/** Opens the database with the test league, made by another installation,
 * already open and saved. */
async function openWithLeague(): Promise<void> {
  await open();
  const wrapper = leagueWrapper();
  const made = {
    ...wrapper,
    content: {
      ...wrapper.content,
      createdByInstallation: OTHER_INSTALLATION,
      lastModifiedByInstallation: OTHER_INSTALLATION,
    },
  };
  useDatabaseStore.setState({
    leagues: { [LEAGUE]: made },
    savedLeagues: { [LEAGUE]: made },
  });
}

const phaseOf = (uuid: string = LEAGUE): Phase =>
  state().leagues[uuid].content.phases[0];

beforeEach(() => {
  useDatabaseStore.setState(useDatabaseStore.getInitialState(), true);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('createLeague (US-09.2, US-11.1, Task 105)', () => {
  const teams = [
    instance(),
    instance({
      blueprintUuid: HARBORVIEW,
      slug: 'harborview-sc',
      name: 'Harborview SC',
      tier: 'C',
      ovr: 61,
    }),
    instance({
      blueprintUuid: TOWN,
      slug: 'old-town',
      name: 'Old Town',
      colour: '#000000',
      tier: 'F',
      ovr: 33,
    }),
  ];
  const input = {
    name: 'Coastal Premier',
    homeAdvantage: true,
    points: { win: 3, draw: 1, loss: 0 },
    teams,
  };

  it('makes a league wrapper with a new UUID and the local provenance', async () => {
    await open();
    const wrapper = createLeague(input);

    expect(isUuidV4(wrapper.uuid)).toBe(true);
    expect(wrapper.content).toMatchObject({
      uuid: wrapper.uuid,
      name: 'Coastal Premier',
      homeAdvantage: true,
      points: { win: 3, draw: 1, loss: 0 },
      createdByInstallation: INSTALLATION,
      lastModifiedByInstallation: INSTALLATION,
    });
    expect(state().leagues[wrapper.uuid]).toBe(wrapper);
    expect(isLeagueUnsaved(state(), wrapper.uuid)).toBe(true);
  });

  it('stores the given Instances with their OVR, and rolls nothing (Task 81, Task 120)', async () => {
    await open();
    const wrapper = createLeague(input);
    expect(wrapper.teams).toEqual(teams);
    expect(wrapper.teams).not.toBe(teams);
  });

  it('keeps an Instance whose Blueprint was deleted during the setup (US-09.4)', async () => {
    await open();
    const gone = instance({ blueprintUuid: LEAGUE, slug: 'gone-fc', name: 'Gone FC' });
    const wrapper = createLeague({ ...input, teams: [teams[0], gone] });
    expect(wrapper.teams.map((t) => t.blueprintUuid)).toEqual([SALT_MARSH, LEAGUE]);
  });

  it('builds phase 1 as a two-way round robin with fixture ids, teams by Blueprint UUID', async () => {
    await open();
    const [phase] = createLeague(input).content.phases;

    expect(phase.format).toBe('round-robin');
    // 3 teams: 6 matches, 6 matchdays, one bye each matchday.
    expect(phase.fixtures).toHaveLength(6);
    expect(phase.byes).toHaveLength(6);
    expect(phase.results).toEqual([]);
    expect(phase.fixtures[0].id).toBe('p1.g1.md1.m1');
    const teams = new Set([SALT_MARSH, HARBORVIEW, TOWN]);
    expect(phase.fixtures.every((f) => teams.has(f.home) && teams.has(f.away))).toBe(
      true
    );
    expect(new Set(phase.fixtures.map((f) => f.id)).size).toBe(6);
  });

  it('gives a league with fewer than 2 teams an empty phase 1, as in MVP1', async () => {
    await open();
    const [phase] = createLeague({ ...input, teams: [teams[0]] }).content.phases;
    expect(phase.fixtures).toEqual([]);
    expect(phase.byes).toEqual([]);
  });

  it('allows two leagues with the same name', async () => {
    await open();
    const a = createLeague(input);
    const b = createLeague(input);
    expect(a.uuid).not.toBe(b.uuid);
    expect(Object.keys(state().leagues)).toHaveLength(2);
  });

  it('changes no Blueprint', async () => {
    await open();
    const before = state().blueprints;
    createLeague(input);
    expect(state().blueprints).toBe(before);
  });

  it('throws a RangeError for a Blueprint UUID twice in the list, and adds nothing', async () => {
    await open();
    expect(() =>
      createLeague({ ...input, teams: [teams[0], teams[1], teams[0]] })
    ).toThrow(`The team list has the Blueprint UUID ${SALT_MARSH} twice.`);
    expect(state().leagues).toEqual({});
  });

  it('throws when the database is not open', () => {
    expect(() => createLeague(input)).toThrow('The database is not open.');
  });
});

describe('scorinateFixture', () => {
  it('plays one fixture of the current phase, and stamps the league', async () => {
    await openWithLeague();
    scorinateFixture(LEAGUE, 'p1.g1.md1.m1');

    const [played] = phaseOf().results;
    expect(played).toMatchObject({
      fixtureId: 'p1.g1.md1.m1',
      home: SALT_MARSH,
      away: HARBORVIEW,
    });
    expect(Number.isInteger(played.homeGoals)).toBe(true);
    expect(state().leagues[LEAGUE].content.lastModifiedByInstallation).toBe(
      INSTALLATION
    );
    expect(state().leagues[LEAGUE].content.createdByInstallation).toBe(
      OTHER_INSTALLATION
    );
    expect(isLeagueUnsaved(state(), LEAGUE)).toBe(true);
  });

  it('skips a fixture that has a result', async () => {
    await openWithLeague();
    scorinateFixture(LEAGUE, 'p1.g1.md1.m1');
    const after = state().leagues[LEAGUE];
    scorinateFixture(LEAGUE, 'p1.g1.md1.m1');
    expect(state().leagues[LEAGUE]).toBe(after);
  });

  it('throws a RangeError for an unknown league or fixture', async () => {
    await openWithLeague();
    expect(() => scorinateFixture(HARBORVIEW, 'p1.g1.md1.m1')).toThrow(
      `No open league has the UUID ${HARBORVIEW}.`
    );
    expect(() => scorinateFixture(LEAGUE, 'p1.g1.md9.m1')).toThrow(
      'The league has no fixture "p1.g1.md9.m1" in its current phase.'
    );
  });

  it('uses the home advantage flag and the stored OVR (MVP1 rules)', async () => {
    await openWithLeague();
    // A fixed draw: the same random value gives the same score each time.
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    scorinateFixture(LEAGUE, 'p1.g1.md1.m1');
    const first = phaseOf().results[0];

    useDatabaseStore.setState((s) => ({
      leagues: { ...s.leagues, [LEAGUE]: leagueWrapper() },
    }));
    scorinateFixture(LEAGUE, 'p1.g1.md1.m1');
    expect(phaseOf().results[0]).toEqual(first);
  });
});

describe('rescorinateFixture', () => {
  it('replaces the result in its place, and stamps the league', async () => {
    await openWithLeague();
    const results = [
      result('p1.g1.md1.m1', SALT_MARSH, HARBORVIEW),
      result('p1.g1.md2.m1', HARBORVIEW, SALT_MARSH),
    ];
    useDatabaseStore.setState({ leagues: { [LEAGUE]: leagueWrapper(results) } });
    vi.spyOn(Math, 'random').mockReturnValue(0.99);
    rescorinateFixture(LEAGUE, 'p1.g1.md1.m1');

    const after = phaseOf().results;
    expect(after.map((r) => r.fixtureId)).toEqual(['p1.g1.md1.m1', 'p1.g1.md2.m1']);
    expect(after[1]).toBe(state().leagues[LEAGUE].content.phases[0].results[1]);
    expect(state().leagues[LEAGUE].content.lastModifiedByInstallation).toBe(
      INSTALLATION
    );
  });

  it('does nothing for a fixture with no result', async () => {
    await openWithLeague();
    const before = state().leagues[LEAGUE];
    rescorinateFixture(LEAGUE, 'p1.g1.md1.m1');
    expect(state().leagues[LEAGUE]).toBe(before);
  });
});

describe('scorinateMatchday', () => {
  it('plays each unplayed fixture of the matchday, and only that matchday', async () => {
    await openWithLeague();
    scorinateMatchday(LEAGUE, 2);
    expect(phaseOf().results.map((r) => r.fixtureId)).toEqual(['p1.g1.md2.m1']);
  });

  it('keeps a result that the matchday already has', async () => {
    await openWithLeague();
    const kept = result('p1.g1.md1.m1', SALT_MARSH, HARBORVIEW);
    useDatabaseStore.setState({ leagues: { [LEAGUE]: leagueWrapper([kept]) } });
    scorinateMatchday(LEAGUE, 1);
    expect(phaseOf().results).toEqual([kept]);
  });
});
