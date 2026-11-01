import { describe, expect, it } from 'vitest';
import { fixedLot } from '@/engine/identity';
import type { LeagueWrapper, PhaseResult } from '@/domain';
import {
  HARBORVIEW,
  instance,
  LEAGUE,
  leagueWrapper,
  result,
  SALT_MARSH,
} from '@/test/databaseRecords';
import { canStartNextPhase, phaseStandings } from './phases';

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
