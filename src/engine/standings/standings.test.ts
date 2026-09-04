import { describe, expect, it } from 'vitest';
import { calculateStandings } from './index';
import type { MatchResult, StandingsRow } from './types';

const TEAMS = ['Alpha', 'Bravo', 'Charlie', 'Delta'];

function row(teamId: string, table: readonly StandingsRow<string>[]): StandingsRow<string> {
  const found = table.find((r) => r.team === teamId);
  if (!found) throw new Error(`no row for ${teamId}`);
  return found;
}

describe('calculateStandings', () => {
  it('gives every team a zeroed row, in roster order, when no results exist', () => {
    const table = calculateStandings(TEAMS, []);
    expect(table.map((r) => r.team)).toEqual(TEAMS);
    for (const r of table) {
      expect(r).toMatchObject({
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0,
        points: 0,
      });
    }
  });

  it('awards the default 3/1/0 points for a win, a draw, and a loss', () => {
    const results: MatchResult<string>[] = [
      { home: 'Alpha', away: 'Bravo', homeGoals: 2, awayGoals: 0 }, // Alpha win
      { home: 'Charlie', away: 'Delta', homeGoals: 1, awayGoals: 1 }, // draw
    ];
    const table = calculateStandings(TEAMS, results);
    expect(row('Alpha', table).points).toBe(3);
    expect(row('Bravo', table).points).toBe(0);
    expect(row('Charlie', table).points).toBe(1);
    expect(row('Delta', table).points).toBe(1);
  });

  it('uses a configurable points system instead of the default', () => {
    const results: MatchResult<string>[] = [{ home: 'Alpha', away: 'Bravo', homeGoals: 1, awayGoals: 0 }];
    const table = calculateStandings(TEAMS, results, { win: 2, draw: 1, loss: 0 });
    expect(row('Alpha', table).points).toBe(2);
  });

  it('tracks played, goals for/against, and goal difference across matches', () => {
    const results: MatchResult<string>[] = [
      { home: 'Alpha', away: 'Bravo', homeGoals: 3, awayGoals: 1 },
      { home: 'Bravo', away: 'Alpha', homeGoals: 2, awayGoals: 2 },
    ];
    const table = calculateStandings(TEAMS, results);
    const alpha = row('Alpha', table);
    expect(alpha.played).toBe(2);
    expect(alpha.won).toBe(1);
    expect(alpha.drawn).toBe(1);
    expect(alpha.goalsFor).toBe(5);
    expect(alpha.goalsAgainst).toBe(3);
    expect(alpha.goalDifference).toBe(2);
  });

  it('sorts by points, then goal difference, then goals for, then roster order', () => {
    const results: MatchResult<string>[] = [
      // Alpha and Bravo both finish on 3 points, same goal difference; Bravo scored more.
      { home: 'Alpha', away: 'Charlie', homeGoals: 1, awayGoals: 0 },
      { home: 'Bravo', away: 'Delta', homeGoals: 2, awayGoals: 1 },
    ];
    const table = calculateStandings(TEAMS, results);
    expect(table.map((r) => r.team)).toEqual(['Bravo', 'Alpha', 'Delta', 'Charlie']);
  });

  it('breaks a full points/GD/GF tie with a single head-to-head win', () => {
    const roster = ['Bravo', 'Alpha', 'Charlie', 'Delta'];
    const results: MatchResult<string>[] = [
      { home: 'Alpha', away: 'Bravo', homeGoals: 1, awayGoals: 0 }, // only leg played so far: Alpha win
      { home: 'Alpha', away: 'Charlie', homeGoals: 1, awayGoals: 1 },
      { home: 'Bravo', away: 'Charlie', homeGoals: 2, awayGoals: 0 },
      { home: 'Bravo', away: 'Delta', homeGoals: 0, awayGoals: 0 },
    ];
    const table = calculateStandings(roster, results);
    // Alpha and Bravo both finish on 4 points, GD 1, GF 2 — a full tie
    // ahead of head-to-head. Alpha's sole head-to-head win puts it first,
    // even though Bravo comes first in the roster.
    expect(row('Alpha', table).points).toBe(row('Bravo', table).points);
    expect(row('Alpha', table).goalDifference).toBe(row('Bravo', table).goalDifference);
    expect(row('Alpha', table).goalsFor).toBe(row('Bravo', table).goalsFor);
    expect(table.map((r) => r.team)).toEqual(['Alpha', 'Bravo', 'Delta', 'Charlie']);
  });

  it('breaks a full points/GD/GF tie with aggregate head-to-head goals, after a 1-1 split', () => {
    const roster = ['Bravo', 'Alpha', 'Charlie', 'Delta'];
    const results: MatchResult<string>[] = [
      { home: 'Alpha', away: 'Bravo', homeGoals: 3, awayGoals: 1 }, // leg 1: Alpha win
      { home: 'Bravo', away: 'Alpha', homeGoals: 2, awayGoals: 1 }, // leg 2: Bravo win
      { home: 'Alpha', away: 'Charlie', homeGoals: 2, awayGoals: 1 },
      { home: 'Bravo', away: 'Delta', homeGoals: 3, awayGoals: 0 },
    ];
    const table = calculateStandings(roster, results);
    // Both finish on 6 points, GD 2, GF 6 — a full tie, and a 1-1
    // head-to-head split. Alpha scored 4 against Bravo, Bravo scored 3
    // against Alpha, so Alpha's higher aggregate puts it first.
    expect(row('Alpha', table).points).toBe(row('Bravo', table).points);
    expect(row('Alpha', table).goalDifference).toBe(row('Bravo', table).goalDifference);
    expect(row('Alpha', table).goalsFor).toBe(row('Bravo', table).goalsFor);
    expect(table.map((r) => r.team)).toEqual(['Alpha', 'Bravo', 'Charlie', 'Delta']);
  });

  it('falls through to roster order after a 1-1 split with equal aggregate goals', () => {
    const roster = ['Bravo', 'Alpha', 'Charlie', 'Delta'];
    const results: MatchResult<string>[] = [
      { home: 'Alpha', away: 'Bravo', homeGoals: 2, awayGoals: 1 }, // leg 1: Alpha win
      { home: 'Bravo', away: 'Alpha', homeGoals: 2, awayGoals: 1 }, // leg 2: Bravo win
    ];
    const table = calculateStandings(roster, results);
    // Both finish 3 points, GD 0, GF 3, a 1-1 split, and an equal 3-3
    // aggregate. Nothing left to break the tie except roster order.
    expect(row('Alpha', table).points).toBe(row('Bravo', table).points);
    expect(table.map((r) => r.team).slice(0, 2)).toEqual(['Bravo', 'Alpha']);
  });

  it('falls through to roster order when the two teams have not played each other yet', () => {
    const roster = ['Bravo', 'Alpha', 'Charlie', 'Delta'];
    const results: MatchResult<string>[] = [
      { home: 'Alpha', away: 'Charlie', homeGoals: 2, awayGoals: 0 },
      { home: 'Bravo', away: 'Delta', homeGoals: 2, awayGoals: 0 },
    ];
    const table = calculateStandings(roster, results);
    expect(row('Alpha', table).points).toBe(row('Bravo', table).points);
    expect(table.map((r) => r.team).slice(0, 2)).toEqual(['Bravo', 'Alpha']);
  });

  it('reflects an updated result set on recalculation, as a re-scorinate would', () => {
    const before: MatchResult<string>[] = [{ home: 'Alpha', away: 'Bravo', homeGoals: 1, awayGoals: 1 }];
    const after: MatchResult<string>[] = [{ home: 'Alpha', away: 'Bravo', homeGoals: 3, awayGoals: 0 }];
    const tableBefore = calculateStandings(TEAMS, before);
    const tableAfter = calculateStandings(TEAMS, after);
    expect(row('Alpha', tableBefore).points).toBe(1);
    expect(row('Alpha', tableAfter).points).toBe(3);
  });

  it('rejects a result for a team outside the given roster', () => {
    const results: MatchResult<string>[] = [{ home: 'Alpha', away: 'Zulu', homeGoals: 1, awayGoals: 0 }];
    expect(() => calculateStandings(TEAMS, results)).toThrow(RangeError);
  });
});
