import { describe, expect, it } from 'vitest';
import { fixedLot } from '@/engine/identity';
import type { LeagueWrapper, PhaseResult } from '@/domain';
import { pickQualifiers, type PhasePlan } from '@/engine/phases';
import {
  groupsLeague as drawnGroupsLeague,
  HARBORVIEW,
  instance,
  LEAGUE,
  leagueWrapper,
  result,
  roundRobinLeague,
  SALT_MARSH,
  scheduled,
} from '@/test/databaseRecords';
import {
  canChangeCurrentGroups,
  canStartNextPhase,
  leagueLotOf,
  getPhaseZoneView,
  phaseStandings,
} from './phases';

const NORTH = '00000000-0000-4000-8000-0000000000a3';
const EAST = '00000000-0000-4000-8000-0000000000a4';

/** A four-team league: phase 1 is Groups (A: Salt Marsh and Harborview, B:
 * North and East, single duels, top 1), phase 2 a round robin. */
function groupsLeague(results: PhaseResult[] = []): LeagueWrapper {
  const base = leagueWrapper();
  return {
    ...base,
    teams: [
      ...base.teams,
      instance({ blueprintUuid: NORTH, slug: 'north', name: 'North' }),
      instance({ blueprintUuid: EAST, slug: 'east', name: 'East' }),
    ],
    content: {
      ...base.content,
      plans: [
        {
          format: 'groups',
          legs: 'single-duels',
          grouping: { by: 'count', count: 2 },
          advance: { top: 1, bestOfNext: 0 },
        },
        { format: 'round-robin', legs: 'two-way' },
      ],
      phases: [
        {
          format: 'groups',
          legs: 'single-duels',
          groups: [
            [SALT_MARSH, HARBORVIEW],
            [NORTH, EAST],
          ],
          fixtures: [
            { id: 'p1.g1.md1.m1', matchday: 1, home: SALT_MARSH, away: HARBORVIEW },
            { id: 'p1.g2.md1.m1', matchday: 1, home: NORTH, away: EAST },
          ],
          byes: [],
          results,
        },
      ],
    },
  };
}

/** The groups league after phase 1, with phase 2 started: Salt Marsh and
 * North in a two-way round robin. */
function phaseTwoLeague(): LeagueWrapper {
  const league = groupsLeague([
    result('p1.g1.md1.m1', SALT_MARSH, HARBORVIEW),
    result('p1.g2.md1.m1', NORTH, EAST),
  ]);
  return {
    ...league,
    content: {
      ...league.content,
      phases: [
        ...league.content.phases,
        {
          format: 'round-robin',
          legs: 'two-way',
          fixtures: [
            { id: 'p2.g1.md1.m1', matchday: 1, home: NORTH, away: SALT_MARSH },
            { id: 'p2.g1.md2.m1', matchday: 2, home: SALT_MARSH, away: NORTH },
          ],
          byes: [],
          results: [],
        },
      ],
    },
  };
}

const teamsOf = (table: readonly { team: string }[]): string[] =>
  table.map((r) => r.team);

describe('phaseStandings (Task 128)', () => {
  it('gives one table with every league team for a phase-1 round robin', () => {
    const tables = phaseStandings(
      leagueWrapper([result('p1.g1.md1.m1', SALT_MARSH, HARBORVIEW)]),
      0
    );
    expect(tables).toHaveLength(1);
    expect(teamsOf(tables[0])).toEqual([SALT_MARSH, HARBORVIEW]);
    expect(tables[0][0].points).toBe(3);
  });

  it('gives one table for each group, from the results of that group only', () => {
    const tables = phaseStandings(
      groupsLeague([result('p1.g2.md1.m1', NORTH, EAST)]),
      0
    );
    expect(tables).toHaveLength(2);
    expect(teamsOf(tables[0]).sort()).toEqual([SALT_MARSH, HARBORVIEW].sort());
    expect(tables[0].every((row) => row.played === 0)).toBe(true);
    expect(teamsOf(tables[1])).toEqual([NORTH, EAST]);
    expect(tables[1][0].points).toBe(3);
  });

  it('orders level teams by the fixed lot of the league and the team (Task 124)', () => {
    const [table] = phaseStandings(groupsLeague(), 0);
    const lotOrder = [SALT_MARSH, HARBORVIEW].sort(
      (a, b) => fixedLot(LEAGUE, a) - fixedLot(LEAGUE, b)
    );
    expect(teamsOf(table)).toEqual(lotOrder);
  });

  it('starts each phase from zero (US-07.1)', () => {
    const league = phaseTwoLeague();
    const [phaseOne] = phaseStandings(league, 0);
    expect(phaseOne.find((row) => row.team === SALT_MARSH)?.points).toBe(3);

    const [phaseTwo] = phaseStandings(league, 1);
    expect(teamsOf(phaseTwo).sort()).toEqual([SALT_MARSH, NORTH].sort());
    for (const row of phaseTwo) {
      expect(row).toMatchObject({ played: 0, won: 0, goalsFor: 0, points: 0 });
    }
  });

  it('throws a RangeError for a phase that has not started', () => {
    expect(() => phaseStandings(groupsLeague(), 1)).toThrow(RangeError);
  });
});

describe('canStartNextPhase (Task 128)', () => {
  it('is false while the current phase has an unplayed fixture', () => {
    expect(
      canStartNextPhase(groupsLeague([result('p1.g1.md1.m1', SALT_MARSH, HARBORVIEW)]))
    ).toBe(false);
  });

  it('is true when the current phase is complete and a next plan exists', () => {
    expect(
      canStartNextPhase(
        groupsLeague([
          result('p1.g1.md1.m1', SALT_MARSH, HARBORVIEW),
          result('p1.g2.md1.m1', NORTH, EAST),
        ])
      )
    ).toBe(true);
  });

  it('is false on the last planned phase, also when it is complete', () => {
    expect(
      canStartNextPhase(
        leagueWrapper([
          result('p1.g1.md1.m1', SALT_MARSH, HARBORVIEW),
          result('p1.g1.md2.m1', HARBORVIEW, SALT_MARSH),
        ])
      )
    ).toBe(false);
  });
});

describe('getPhaseZoneView (Task 155, US-12.5, US-02.2, US-07.2)', () => {
  const TEAMS = ['A', 'B', 'C', 'D', 'E', 'F'].map((name) => ({
    name,
    colour: '#1565C0',
  }));
  const GROUPS_BEST_OF_NEXT: PhasePlan[] = [
    {
      format: 'groups',
      legs: 'two-way',
      grouping: { by: 'count', count: 2 },
      advance: { top: 1, bestOfNext: 1 },
    },
    { format: 'bracket' },
  ];
  /** Every fixture of phase 1 ends 1-0 for the home team. */
  function playAll(wrapper: LeagueWrapper): LeagueWrapper {
    const phase = scheduled(wrapper.content.phases[0]);
    const results = phase.fixtures.map((f) => ({
      fixtureId: f.id,
      home: f.home,
      away: f.away,
      homeGoals: 1,
      awayGoals: 0,
    }));
    return {
      ...wrapper,
      content: { ...wrapper.content, phases: [{ ...phase, results }] },
    };
  }

  it('gives no zone and no colour to a last phase with no stored zones', () => {
    const view = getPhaseZoneView(roundRobinLeague(TEAMS.slice(0, 4)), 0);
    expect(view.zones).toEqual([]);
    expect(view.colours.size).toBe(0);
  });

  it('gives the free zones of a last phase to the rows of their places', () => {
    const base = roundRobinLeague(TEAMS.slice(0, 4));
    const wrapper: LeagueWrapper = {
      ...base,
      content: {
        ...base.content,
        plans: [
          {
            format: 'round-robin',
            legs: 'two-way',
            zones: [{ colour: 'red', places: { from: 3, to: 4 }, label: 'Out' }],
          },
        ],
      },
    };
    const [table] = phaseStandings(wrapper, 0);
    const view = getPhaseZoneView(wrapper, 0);
    expect(view.zones).toEqual([
      { colour: 'red', from: 3, to: 4, label: 'Out', automatic: false },
    ]);
    expect([...view.colours.keys()]).toEqual(table.slice(2).map((row) => row.team));
    expect([...view.colours.values()]).toEqual(['red', 'red']);
  });

  it('gives no zone to a bracket phase that has not started', () => {
    const view = getPhaseZoneView(
      drawnGroupsLeague(
        TEAMS,
        [
          [1, 2, 3],
          [4, 5, 6],
        ],
        GROUPS_BEST_OF_NEXT
      ),
      1
    );
    expect(view).toEqual({ zones: [], colours: new Map() });
  });

  it('colours the top N rows of a round robin that is not the last green', () => {
    const base = roundRobinLeague(TEAMS.slice(0, 4));
    const wrapper: LeagueWrapper = {
      ...base,
      content: {
        ...base.content,
        plans: [
          { format: 'round-robin', legs: 'two-way', advance: { top: 2 } },
          { format: 'bracket' },
        ],
      },
    };
    const [table] = phaseStandings(wrapper, 0);
    const { colours } = getPhaseZoneView(wrapper, 0);
    expect([...colours.keys()]).toEqual(table.slice(0, 2).map((row) => row.team));
    expect([...colours.values()]).toEqual(['green', 'green']);
  });

  it('colours the top N of each group green, and place N + 1 yellow, during the phase', () => {
    const wrapper = drawnGroupsLeague(
      TEAMS,
      [
        [1, 2, 3],
        [4, 5, 6],
      ],
      GROUPS_BEST_OF_NEXT
    );
    const tables = phaseStandings(wrapper, 0);
    const { colours } = getPhaseZoneView(wrapper, 0);
    for (const table of tables) {
      expect(colours.get(table[0].team)).toBe('green');
      expect(colours.get(table[1].team)).toBe('yellow');
      expect(colours.has(table[2].team)).toBe(false);
    }
  });

  it('colours the qualifiers of pickQualifiers only, when the phase is complete', () => {
    const wrapper = playAll(
      drawnGroupsLeague(
        TEAMS,
        [
          [1, 2, 3],
          [4, 5, 6],
        ],
        GROUPS_BEST_OF_NEXT
      )
    );
    const qualifiers = pickQualifiers(
      GROUPS_BEST_OF_NEXT[0],
      phaseStandings(wrapper, 0),
      leagueLotOf(wrapper)
    );
    const { colours } = getPhaseZoneView(wrapper, 0);
    expect([...colours.keys()].sort()).toEqual([...qualifiers].sort());
    expect(qualifiers).toHaveLength(3);
    expect([...colours.values()].every((colour) => colour === 'green')).toBe(true);
  });
});

describe('canChangeCurrentGroups (Task 181, US-02.1)', () => {
  const laterGroups = (results: PhaseResult[] = []): LeagueWrapper => {
    const wrapper = groupsLeague();
    const phase = scheduled(wrapper.content.phases[0]);
    if (phase.format !== 'groups') throw new Error('expected Groups');
    return {
      ...wrapper,
      content: {
        ...wrapper.content,
        phases: [
          {
            format: 'round-robin',
            legs: 'two-way',
            fixtures: [],
            byes: [],
            results: [],
          },
          { ...phase, results },
        ],
      },
    };
  };

  it('is true for a later Groups phase with no result', () => {
    expect(canChangeCurrentGroups(laterGroups())).toBe(true);
  });

  it('is false after the first result', () => {
    expect(
      canChangeCurrentGroups(
        laterGroups([result('p1.g1.md1.m1', SALT_MARSH, HARBORVIEW)])
      )
    ).toBe(false);
  });

  it('is false for phase 1 and for a round robin', () => {
    expect(canChangeCurrentGroups(groupsLeague())).toBe(false);
    expect(canChangeCurrentGroups(leagueWrapper())).toBe(false);
  });
});
