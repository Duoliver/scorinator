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
  moveTeamInCurrentGroups,
  type CreateLeagueInput,
  rescorinateFixture,
  scorinateFixture,
  scorinateMatchday,
  shuffleCurrentGroups,
  swapTeamsInCurrentGroups,
  startNextPhase,
} from './leagueWrapperActions';
import { canStartNextPhase, phaseStandings } from './phases';
import type { PhasePlan } from '@/engine/phases';

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
    expect(wrapper.teams.map(({ trigram: _t, ...rest }) => rest)).toEqual(
      teams.map(({ trigram: _t, ...rest }) => rest)
    );
    expect(wrapper.teams).not.toBe(teams);
  });

  it('stores the picked trigram on each Instance, with the fixed ones first (Task 121)', async () => {
    await open();
    const wrapper = createLeague({ ...input, fixedTrigrams: { [TOWN]: 'SMU' } });
    // Each test Blueprint has the list ['SMU']. Old Town has it fixed. Salt
    // Marsh (Tier B) then picks before Harborview (Tier C): SM2, then SM3.
    expect(wrapper.teams.map((t) => t.trigram)).toEqual(['SM2', 'SM3', 'SMU']);
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

  it('throws a RangeError for fewer than 2 teams, and adds nothing (Task 128 choice 2)', async () => {
    await open();
    expect(() => createLeague({ ...input, teams: [teams[0]] })).toThrow(RangeError);
    expect(state().leagues).toEqual({});
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

// --- Phases (Task 128) ---------------------------------------------------

const NORTH = '00000000-0000-4000-8000-0000000000c1';
const EAST = '00000000-0000-4000-8000-0000000000c2';

const fourTeams = [
  instance(),
  instance({ blueprintUuid: HARBORVIEW, slug: 'harborview-sc', name: 'Harborview SC' }),
  instance({ blueprintUuid: NORTH, slug: 'north', name: 'North' }),
  instance({ blueprintUuid: EAST, slug: 'east', name: 'East' }),
];

const WEST = '00000000-0000-4000-8000-0000000000c3';
const SOUTH = '00000000-0000-4000-8000-0000000000c4';
const sixTeams = [
  ...fourTeams,
  instance({ blueprintUuid: WEST, slug: 'west', name: 'West' }),
  instance({ blueprintUuid: SOUTH, slug: 'south', name: 'South' }),
];

const groupsThenRoundRobin: PhasePlan[] = [
  {
    format: 'groups',
    legs: 'single-duels',
    grouping: { by: 'count', count: 2 },
    advance: { top: 1, bestOfNext: 0 },
  },
  { format: 'round-robin', legs: 'two-way' },
];

const roundRobinThenGroups: PhasePlan[] = [
  { format: 'round-robin', legs: 'single-duels', advance: { top: 5 } },
  { format: 'groups', legs: 'single-duels', grouping: { by: 'count', count: 2 } },
];

/** The create input of a phase test. `roundRobinThenGroups` needs 6 teams:
 * its top 5 must be less than the team count. */
function phaseInput(
  plans: PhasePlan[] | undefined,
  groups?: string[][]
): CreateLeagueInput {
  return {
    name: 'Phase Cup',
    homeAdvantage: false,
    points: { win: 3, draw: 1, loss: 0 },
    teams: plans === roundRobinThenGroups ? sixTeams : fourTeams,
    plans,
    ...(groups ? { groups } : {}),
  };
}

/** Plays every fixture of the current phase of a league. */
function playCurrentPhase(uuid: string): void {
  const { phases } = state().leagues[uuid].content;
  const matchdays = new Set(phases[phases.length - 1].fixtures.map((f) => f.matchday));
  for (const matchday of matchdays) scorinateMatchday(uuid, matchday);
}

const phasesOf = (uuid: string): Phase[] => state().leagues[uuid].content.phases;

describe('createLeague with plans (Task 128)', () => {
  it('stores one two-way round-robin plan by default', async () => {
    await open();
    const league = createLeague(phaseInput(undefined));
    expect(league.content.plans).toEqual([{ format: 'round-robin', legs: 'two-way' }]);
  });

  it('stores the plans, and builds phase 1 as Groups from the given draw', async () => {
    await open();
    const groups = [
      [SALT_MARSH, NORTH],
      [HARBORVIEW, EAST],
    ];
    const league = createLeague(phaseInput(groupsThenRoundRobin, groups));
    expect(league.content.plans).toEqual(groupsThenRoundRobin);
    const [phase] = league.content.phases;
    expect(phase.format).toBe('groups');
    if (phase.format !== 'groups') return;
    expect(phase.groups).toEqual(groups);
    expect(phase.legs).toBe('single-duels');
    expect(phase.fixtures.map((f) => f.id).sort()).toEqual([
      'p1.g1.md1.m1',
      'p1.g2.md1.m1',
    ]);
  });

  it('builds a single-duels round robin: each pair once', async () => {
    await open();
    const [phase] = createLeague(phaseInput(roundRobinThenGroups)).content.phases;
    expect(phase.fixtures).toHaveLength(15);
  });

  it('throws a RangeError for a chain problem, and adds nothing', async () => {
    await open();
    const bracketFirst: PhasePlan[] = [{ format: 'bracket' }, roundRobinThenGroups[1]];
    expect(() => createLeague(phaseInput(bracketFirst))).toThrow(RangeError);
    expect(state().leagues).toEqual({});
  });

  it('throws a RangeError for a fit problem, with the real group sizes', async () => {
    await open();
    const tooMany: PhasePlan[] = [
      { format: 'round-robin', legs: 'two-way', advance: { top: 4 } },
      { format: 'round-robin', legs: 'two-way' },
    ];
    expect(() => createLeague(phaseInput(tooMany))).toThrow(RangeError);
    // A move left a group with one team.
    expect(() =>
      createLeague(
        phaseInput(groupsThenRoundRobin, [[SALT_MARSH], [HARBORVIEW, NORTH, EAST]])
      )
    ).toThrow(RangeError);
    expect(state().leagues).toEqual({});
  });
});

describe('startNextPhase (Task 128, US-07.3)', () => {
  it('throws a RangeError while the current phase is not complete', async () => {
    await open();
    const { uuid } = createLeague(phaseInput(roundRobinThenGroups));
    expect(canStartNextPhase(state().leagues[uuid])).toBe(false);
    expect(() => startNextPhase(uuid)).toThrow(RangeError);
  });

  it('throws a RangeError on the last planned phase', async () => {
    await open();
    const { uuid } = createLeague(phaseInput(undefined));
    playCurrentPhase(uuid);
    expect(() => startNextPhase(uuid)).toThrow(RangeError);
  });

  it('sends the group winners into the next phase, in seed order', async () => {
    await open();
    const groups = [
      [SALT_MARSH, NORTH],
      [HARBORVIEW, EAST],
    ];
    const { uuid } = createLeague(phaseInput(groupsThenRoundRobin, groups));
    playCurrentPhase(uuid);
    const winners = phaseStandings(state().leagues[uuid], 0).map(
      (table) => table[0].team
    );

    startNextPhase(uuid);

    const phases = phasesOf(uuid);
    expect(phases).toHaveLength(2);
    expect(phases[1].format).toBe('round-robin');
    const teamsInPhaseTwo = new Set(
      phases[1].fixtures.flatMap((f) => [f.home, f.away])
    );
    expect([...teamsInPhaseTwo].sort()).toEqual([...winners].sort());
    expect(phases[1].fixtures.every((f) => f.id.startsWith('p2.g1.'))).toBe(true);
    expect(phases[1].results).toEqual([]);
    expect(isLeagueUnsaved(state(), uuid)).toBe(true);
  });

  it('keeps phase 1 as it was, and plays only phase 2 after the start (the lock)', async () => {
    await open();
    const groups = [
      [SALT_MARSH, NORTH],
      [HARBORVIEW, EAST],
    ];
    const { uuid } = createLeague(phaseInput(groupsThenRoundRobin, groups));
    playCurrentPhase(uuid);
    const phaseOne = phasesOf(uuid)[0];

    startNextPhase(uuid);
    scorinateMatchday(uuid, 1);

    expect(phasesOf(uuid)[0]).toBe(phaseOne);
    expect(phasesOf(uuid)[1].results.length).toBeGreaterThan(0);
  });

  it('draws a later Groups phase from the qualifiers', async () => {
    await open();
    const { uuid } = createLeague(phaseInput(roundRobinThenGroups));
    playCurrentPhase(uuid);
    startNextPhase(uuid);
    const phase = phasesOf(uuid)[1];
    expect(phase.format).toBe('groups');
    if (phase.format !== 'groups') return;
    expect(phase.groups.map((group) => group.length)).toEqual([3, 2]);
    const topFive = phaseStandings(state().leagues[uuid], 0)[0]
      .slice(0, 5)
      .map((row) => row.team);
    expect(phase.groups.flat().sort()).toEqual([...topFive].sort());
  });
});

describe('shuffle and move in a later Groups phase (Task 128 choice 5)', () => {
  async function leagueInPhaseTwo(): Promise<string> {
    await open();
    const { uuid } = createLeague(phaseInput(roundRobinThenGroups));
    playCurrentPhase(uuid);
    startNextPhase(uuid);
    return uuid;
  }

  /** Each fixture of a Groups phase is inside the group of its id. */
  function fixturesMatchGroups(uuid: string): boolean {
    const phase = phasesOf(uuid)[1];
    if (phase.format !== 'groups') return false;
    return phase.fixtures.every((fixture) => {
      const group = Number(fixture.id.split('.')[1].slice(1)) - 1;
      return (
        phase.groups[group].includes(fixture.home) &&
        phase.groups[group].includes(fixture.away)
      );
    });
  }

  it('shuffles the draw, keeps the teams, and builds the fixtures again', async () => {
    const uuid = await leagueInPhaseTwo();
    shuffleCurrentGroups(uuid);
    const phase = phasesOf(uuid)[1];
    if (phase.format !== 'groups') throw new Error('expected Groups');
    const topFive = phaseStandings(state().leagues[uuid], 0)[0]
      .slice(0, 5)
      .map((row) => row.team);
    expect(phase.groups.flat().sort()).toEqual([...topFive].sort());
    expect(fixturesMatchGroups(uuid)).toBe(true);
  });

  it('moves one team to another group, and builds the fixtures again', async () => {
    const uuid = await leagueInPhaseTwo();
    const before = phasesOf(uuid)[1];
    if (before.format !== 'groups') throw new Error('expected Groups');
    // Group A has 3 teams, so a move keeps 2 in it.
    const team = before.groups[0][0];
    moveTeamInCurrentGroups(uuid, team, 1);
    const after = phasesOf(uuid)[1];
    if (after.format !== 'groups') throw new Error('expected Groups');
    expect(after.groups[0]).not.toContain(team);
    expect(after.groups[1]).toContain(team);
    expect(fixturesMatchGroups(uuid)).toBe(true);
  });

  it('throws a RangeError for a move that leaves a group with fewer than 2 teams', async () => {
    const uuid = await leagueInPhaseTwo();
    const phase = phasesOf(uuid)[1];
    if (phase.format !== 'groups') throw new Error('expected Groups');
    // Group B has 2 teams.
    expect(() => moveTeamInCurrentGroups(uuid, phase.groups[1][0], 0)).toThrow(
      'A group needs at least 2 teams.'
    );
    expect(phasesOf(uuid)[1]).toBe(phase);
  });

  it('swaps two teams of two groups, keeps the sizes, and builds the fixtures again (Task 183)', async () => {
    const uuid = await leagueInPhaseTwo();
    const before = phasesOf(uuid)[1];
    if (before.format !== 'groups') throw new Error('expected Groups');
    // Group B has 2 teams: a swap works where a move does not.
    const [a] = before.groups[0];
    const [b] = before.groups[1];
    swapTeamsInCurrentGroups(uuid, b, a);
    const after = phasesOf(uuid)[1];
    if (after.format !== 'groups') throw new Error('expected Groups');
    expect(after.groups.map((group) => group.length)).toEqual([3, 2]);
    expect(after.groups[0]).toContain(b);
    expect(after.groups[1]).toContain(a);
    expect(fixturesMatchGroups(uuid)).toBe(true);
  });

  it('throws a RangeError for a swap once the phase has a result (Task 183)', async () => {
    const uuid = await leagueInPhaseTwo();
    scorinateMatchday(uuid, 1);
    const phase = phasesOf(uuid)[1];
    if (phase.format !== 'groups') throw new Error('expected Groups');
    expect(() =>
      swapTeamsInCurrentGroups(uuid, phase.groups[0][0], phase.groups[1][0])
    ).toThrow(RangeError);
  });

  it('throws a RangeError once the phase has a result', async () => {
    const uuid = await leagueInPhaseTwo();
    scorinateMatchday(uuid, 1);
    expect(() => shuffleCurrentGroups(uuid)).toThrow(RangeError);
    const phase = phasesOf(uuid)[1];
    if (phase.format !== 'groups') throw new Error('expected Groups');
    expect(() => moveTeamInCurrentGroups(uuid, phase.groups[0][0], 1)).toThrow(
      RangeError
    );
  });

  it('throws a RangeError for phase 1 Groups, and for a round-robin phase', async () => {
    await open();
    const groups = [
      [SALT_MARSH, NORTH],
      [HARBORVIEW, EAST],
    ];
    const groupsLeague = createLeague(phaseInput(groupsThenRoundRobin, groups));
    expect(() => shuffleCurrentGroups(groupsLeague.uuid)).toThrow(RangeError);
    const roundRobin = createLeague(phaseInput(roundRobinThenGroups));
    expect(() => shuffleCurrentGroups(roundRobin.uuid)).toThrow(RangeError);
  });
});
