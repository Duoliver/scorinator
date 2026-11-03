import { describe, expect, it } from 'vitest';
import { calculateStandings, orderAcrossGroups, pickBestOfPlace } from './index';
import type { StandingsRow } from './types';

function rowOf(
  team: string,
  stats: { played: number; points: number; goalDifference: number; goalsFor: number }
): StandingsRow<string> {
  return {
    team,
    won: 0,
    drawn: 0,
    lost: 0,
    goalsAgainst: stats.goalsFor - stats.goalDifference,
    sortOrder: 1,
    position: 1,
    positionText: '1',
    ...stats,
  };
}

const teamsOf = (rows: readonly StandingsRow<string>[]): string[] =>
  rows.map((r) => r.team);

describe('orderAcrossGroups', () => {
  it('orders by points, then goal difference, then goals for', () => {
    const rows = [
      rowOf('A', { played: 3, points: 6, goalDifference: 1, goalsFor: 4 }),
      rowOf('B', { played: 3, points: 7, goalDifference: 0, goalsFor: 2 }),
      rowOf('C', { played: 3, points: 6, goalDifference: 1, goalsFor: 5 }),
      rowOf('D', { played: 3, points: 6, goalDifference: 2, goalsFor: 3 }),
    ];
    expect(teamsOf(orderAcrossGroups(rows))).toEqual(['B', 'D', 'C', 'A']);
  });

  it('compares per match played when the groups differ in size', () => {
    // A: 7 points in 4 matches (1.75 a match). B: 6 points in 3 (2.0).
    const rows = [
      rowOf('A', { played: 4, points: 7, goalDifference: 3, goalsFor: 6 }),
      rowOf('B', { played: 3, points: 6, goalDifference: 1, goalsFor: 3 }),
    ];
    expect(teamsOf(orderAcrossGroups(rows))).toEqual(['B', 'A']);
  });

  it('treats equal rates as level: 8 points in 4 equals 6 points in 3', () => {
    const rows = [
      rowOf('A', { played: 4, points: 8, goalDifference: 4, goalsFor: 4 }),
      rowOf('B', { played: 3, points: 6, goalDifference: 3, goalsFor: 3 }),
    ];
    expect(teamsOf(orderAcrossGroups(rows, (t) => (t === 'A' ? 2 : 1)))).toEqual([
      'B',
      'A',
    ]);
    expect(teamsOf(orderAcrossGroups(rows, (t) => (t === 'A' ? 1 : 2)))).toEqual([
      'A',
      'B',
    ]);
  });

  it('counts a team with 0 matches as 0', () => {
    const rows = [
      rowOf('A', { played: 0, points: 0, goalDifference: 0, goalsFor: 0 }),
      rowOf('B', { played: 2, points: 1, goalDifference: 0, goalsFor: 1 }),
      rowOf('C', { played: 2, points: 0, goalDifference: -3, goalsFor: 0 }),
    ];
    expect(teamsOf(orderAcrossGroups(rows))).toEqual(['B', 'A', 'C']);
  });

  it('uses the lot, lower first, after the football criteria', () => {
    const level = { played: 3, points: 4, goalDifference: 0, goalsFor: 2 };
    const rows = [rowOf('A', level), rowOf('B', level), rowOf('C', level)];
    const lots: Record<string, number> = { A: 3, B: 1, C: 2 };
    expect(teamsOf(orderAcrossGroups(rows, (t) => lots[t]))).toEqual(['B', 'C', 'A']);
  });

  it('keeps the input order (the group order) for equal lots, or with no lot', () => {
    const level = { played: 3, points: 4, goalDifference: 0, goalsFor: 2 };
    const rows = [rowOf('C', level), rowOf('A', level), rowOf('B', level)];
    expect(teamsOf(orderAcrossGroups(rows))).toEqual(['C', 'A', 'B']);
    expect(teamsOf(orderAcrossGroups(rows, () => 7))).toEqual(['C', 'A', 'B']);
  });

  it('does not change its input', () => {
    const rows = [
      rowOf('A', { played: 3, points: 1, goalDifference: 0, goalsFor: 1 }),
      rowOf('B', { played: 3, points: 9, goalDifference: 5, goalsFor: 6 }),
    ];
    orderAcrossGroups(rows);
    expect(teamsOf(rows)).toEqual(['A', 'B']);
  });
});

describe('pickBestOfPlace', () => {
  // Three groups of three. Each group plays a full single round robin, so
  // place 3 of each group is known.
  const tables = [
    calculateStandings(
      ['A1', 'A2', 'A3'],
      [
        { home: 'A1', away: 'A2', homeGoals: 1, awayGoals: 0 },
        { home: 'A1', away: 'A3', homeGoals: 1, awayGoals: 0 },
        { home: 'A2', away: 'A3', homeGoals: 1, awayGoals: 1 }, // A3: 1 pt, GF 1
      ]
    ),
    calculateStandings(
      ['B1', 'B2', 'B3'],
      [
        { home: 'B1', away: 'B2', homeGoals: 1, awayGoals: 0 },
        { home: 'B1', away: 'B3', homeGoals: 1, awayGoals: 0 },
        { home: 'B2', away: 'B3', homeGoals: 2, awayGoals: 0 }, // B3: 0 pts
      ]
    ),
    calculateStandings(
      ['C1', 'C2', 'C3'],
      [
        { home: 'C1', away: 'C2', homeGoals: 1, awayGoals: 0 },
        { home: 'C1', away: 'C3', homeGoals: 1, awayGoals: 0 },
        { home: 'C2', away: 'C3', homeGoals: 3, awayGoals: 3 }, // C3: 1 pt, GF 3
      ]
    ),
  ];

  it('gives the best m rows of one place across the groups, in order', () => {
    expect(teamsOf(pickBestOfPlace(tables, 3, 2))).toEqual(['C3', 'A3']);
    expect(teamsOf(pickBestOfPlace(tables, 3, 3))).toEqual(['C3', 'A3', 'B3']);
  });

  it('gives no rows for m = 0', () => {
    expect(pickBestOfPlace(tables, 3, 0)).toEqual([]);
  });

  it('passes the lot to the order', () => {
    const level = (team: string): StandingsRow<string> =>
      rowOf(team, { played: 2, points: 1, goalDifference: 0, goalsFor: 1 });
    const flat = [[level('X')], [level('Y')], [level('Z')]];
    const lots: Record<string, number> = { X: 3, Y: 2, Z: 1 };
    expect(teamsOf(pickBestOfPlace(flat, 1, 2, (t) => lots[t]))).toEqual(['Z', 'Y']);
  });

  it('throws a RangeError when a table has fewer rows than the place', () => {
    const short = [...tables, tables[0].slice(0, 2)];
    expect(() => pickBestOfPlace(short, 3, 1)).toThrow(RangeError);
  });

  it('throws a RangeError for a place below 1 or not whole', () => {
    expect(() => pickBestOfPlace(tables, 0, 1)).toThrow(RangeError);
    expect(() => pickBestOfPlace(tables, 1.5, 1)).toThrow(RangeError);
  });

  it('throws a RangeError for m below 0, above the table count, or not whole', () => {
    expect(() => pickBestOfPlace(tables, 3, -1)).toThrow(RangeError);
    expect(() => pickBestOfPlace(tables, 3, 4)).toThrow(RangeError);
    expect(() => pickBestOfPlace(tables, 3, 1.5)).toThrow(RangeError);
  });
});
