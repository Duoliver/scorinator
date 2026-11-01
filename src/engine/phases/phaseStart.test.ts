import { describe, expect, it } from 'vitest';
import {
  buildPhase,
  canChangeDraw,
  isPhaseComplete,
  isPhaseLocked,
  pickQualifiers,
  type GroupsPlan,
  type RoundRobinPlan,
} from './index';
import { createSeededRng } from '@/engine/rng';
import type { PhaseFixture } from '@/engine/round-robin';
import {
  calculateStandings,
  type MatchResult,
  type StandingsRow,
} from '@/engine/standings';

function teamsOf(prefix: string, n: number): string[] {
  return Array.from({ length: n }, (_, i) => `${prefix}${i + 1}`);
}

// A table where the teams finish in roster order: each team beats every
// team after it.
function tableInOrder(teams: readonly string[]): StandingsRow<string>[] {
  const results: MatchResult<string>[] = [];
  teams.forEach((home, i) => {
    for (const away of teams.slice(i + 1)) {
      results.push({ home, away, homeGoals: 1, awayGoals: 0 });
    }
  });
  return calculateStandings(teams, results);
}

const roundRobinPlan = (
  top?: number,
  legs: RoundRobinPlan['legs'] = 'two-way'
): RoundRobinPlan => ({
  format: 'round-robin',
  legs,
  ...(top === undefined ? {} : { advance: { top } }),
});

const groupsPlan = (
  top?: number,
  bestOfNext = 0,
  legs: GroupsPlan['legs'] = 'single-duels'
): GroupsPlan => ({
  format: 'groups',
  legs,
  grouping: { by: 'count', count: 2 },
  ...(top === undefined ? {} : { advance: { top, bestOfNext } }),
});

describe('pickQualifiers', () => {
  it('gives the top N of a round robin, in table order', () => {
    const table = tableInOrder(['C', 'A', 'D', 'B']);
    expect(pickQualifiers(roundRobinPlan(2), [table])).toEqual(['C', 'A']);
  });

  it('gives Groups qualifiers place by place: all winners, then all runners-up', () => {
    const tables = [tableInOrder(teamsOf('A', 3)), tableInOrder(teamsOf('B', 3))];
    // A1 and B1 are level (2 wins, 2-0 goals each), as are A2 and B2. The
    // lots set the order inside each place.
    const lots: Record<string, number> = { A1: 2, B1: 1, A2: 1, B2: 2 };
    expect(pickQualifiers(groupsPlan(2), tables, (team) => lots[team] ?? 0)).toEqual([
      'B1',
      'A1',
      'A2',
      'B2',
    ]);
  });

  it('orders a place by the football criteria before the lot', () => {
    const groupA = tableInOrder(teamsOf('A', 3));
    // Group B: B1 wins 3-0 twice, so it is above A1 (1-0 twice) on goal difference.
    const groupB = calculateStandings(
      ['B1', 'B2', 'B3'],
      [
        { home: 'B1', away: 'B2', homeGoals: 3, awayGoals: 0 },
        { home: 'B1', away: 'B3', homeGoals: 3, awayGoals: 0 },
        { home: 'B2', away: 'B3', homeGoals: 1, awayGoals: 0 },
      ]
    );
    expect(pickQualifiers(groupsPlan(1), [groupA, groupB], () => 0)).toEqual([
      'B1',
      'A1',
    ]);
  });

  it('adds the best M of place N + 1 after the top N places', () => {
    const tables = [
      tableInOrder(teamsOf('A', 3)),
      tableInOrder(teamsOf('B', 3)),
      calculateStandings(
        ['C1', 'C2', 'C3'],
        [
          { home: 'C1', away: 'C2', homeGoals: 1, awayGoals: 0 },
          { home: 'C1', away: 'C3', homeGoals: 1, awayGoals: 0 },
          { home: 'C2', away: 'C3', homeGoals: 0, awayGoals: 0 }, // C2 has 1 point
        ]
      ),
    ];
    const qualifiers = pickQualifiers(groupsPlan(1, 1), tables, () => 0);
    expect(qualifiers.slice(0, 3).sort()).toEqual(['A1', 'B1', 'C1']);
    // C2 has 1 point. A2 and B2 have 3 points each, so the best 1 of
    // place 2 is A2 (equal lots keep the group order).
    expect(qualifiers[3]).toBe('A2');
    expect(qualifiers).toHaveLength(4);
  });

  it('throws a RangeError for a plan with no advancement, or a table too short', () => {
    const table = tableInOrder(teamsOf('A', 3));
    expect(() => pickQualifiers(roundRobinPlan(), [table])).toThrow(RangeError);
    expect(() => pickQualifiers(roundRobinPlan(4), [table])).toThrow(RangeError);
    expect(() => pickQualifiers(groupsPlan(3, 1), [table, table])).toThrow(RangeError);
  });
});

describe('buildPhase', () => {
  it('builds a two-way round robin with group-1 ids, in the given team order', () => {
    const teams = teamsOf('T', 4);
    const built = buildPhase(roundRobinPlan(), 2, teams, createSeededRng(1));
    expect(built.format).toBe('round-robin');
    expect(built.fixtures).toHaveLength(12);
    expect(built.byes).toEqual([]);
    for (const fixture of built.fixtures)
      expect(fixture.id).toMatch(/^p2\.g1\.md\d+\.m\d+$/);
    expect(new Set(built.fixtures.map((f) => f.id)).size).toBe(12);
  });

  it('builds single duels: each pair once', () => {
    const built = buildPhase(
      roundRobinPlan(undefined, 'single-duels'),
      1,
      teamsOf('T', 5),
      createSeededRng(1)
    );
    expect(built.fixtures).toHaveLength(10);
    expect(built.byes).toHaveLength(5);
  });

  it('builds Groups from the given draw, with the group number in each id and bye', () => {
    const groups = [teamsOf('A', 3), teamsOf('B', 4)];
    const built = buildPhase(
      groupsPlan(),
      1,
      groups.flat(),
      createSeededRng(1),
      groups
    );
    if (built.format !== 'groups') throw new Error('expected a Groups phase');
    expect(built.groups).toEqual(groups);
    expect(built.fixtures).toHaveLength(3 + 6);
    const inGroup = (group: number): PhaseFixture<string>[] =>
      built.fixtures.filter((f) => f.id.startsWith(`p1.g${group}.`));
    expect(inGroup(1)).toHaveLength(3);
    expect(inGroup(2)).toHaveLength(6);
    for (const fixture of inGroup(1))
      expect(['A1', 'A2', 'A3']).toContain(fixture.home);
    // Group A has 3 teams: one bye on each of its 3 matchdays. Group B has none.
    expect(built.byes).toHaveLength(3);
    for (const bye of built.byes) expect(bye.group).toBe(1);
  });

  it('lists Groups fixtures in group order, then matchday order', () => {
    const groups = [teamsOf('A', 4), teamsOf('B', 4)];
    const built = buildPhase(
      groupsPlan(undefined, 0, 'two-way'),
      1,
      groups.flat(),
      createSeededRng(2),
      groups
    );
    const order = built.fixtures.map((f) => [
      Number(f.id.split('.')[1].slice(1)),
      f.matchday,
    ]);
    const sorted = [...order].sort((x, y) => x[0] - y[0] || x[1] - y[1]);
    expect(order).toEqual(sorted);
  });

  it('draws new groups when it gets none, with groupCountFor', () => {
    const teams = teamsOf('T', 8);
    const built = buildPhase(groupsPlan(), 2, teams, createSeededRng(3));
    if (built.format !== 'groups') throw new Error('expected a Groups phase');
    expect(built.groups).toHaveLength(2);
    expect(built.groups.map((g) => g.length)).toEqual([4, 4]);
    expect(built.groups.flat().sort()).toEqual([...teams].sort());
  });

  it('gives the same build for the same seed', () => {
    const teams = teamsOf('T', 8);
    expect(buildPhase(groupsPlan(), 2, teams, createSeededRng(5))).toEqual(
      buildPhase(groupsPlan(), 2, teams, createSeededRng(5))
    );
  });

  it('throws a RangeError for a bracket (Task 139)', () => {
    expect(() =>
      buildPhase({ format: 'bracket' }, 2, teamsOf('T', 4), createSeededRng(1))
    ).toThrow(RangeError);
  });
});

describe('the phase checks', () => {
  const fixtures = [{ id: 'p1.g1.md1.m1' }, { id: 'p1.g1.md1.m2' }];

  it('isPhaseComplete: true when each fixture has a result', () => {
    expect(isPhaseComplete(fixtures, [{ fixtureId: 'p1.g1.md1.m1' }])).toBe(false);
    expect(
      isPhaseComplete(fixtures, [
        { fixtureId: 'p1.g1.md1.m2' },
        { fixtureId: 'p1.g1.md1.m1' },
      ])
    ).toBe(true);
  });

  it('isPhaseLocked: true for a phase before the latest started phase', () => {
    expect(isPhaseLocked(1, 1)).toBe(false);
    expect(isPhaseLocked(1, 2)).toBe(true);
    expect(isPhaseLocked(2, 2)).toBe(false);
    expect(isPhaseLocked(3, 2)).toBe(false);
  });

  it('canChangeDraw: true while the phase has no result', () => {
    expect(canChangeDraw([])).toBe(true);
    expect(canChangeDraw([{ fixtureId: 'p2.g1.md1.m1' }])).toBe(false);
  });
});
