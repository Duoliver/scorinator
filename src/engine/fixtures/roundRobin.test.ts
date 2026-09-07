import { describe, expect, it } from 'vitest';
import { generateRoundRobin } from './index';
import type { Bye, Fixture } from './types';

function teamsOf(n: number): string[] {
  return Array.from({ length: n }, (_, i) => `T${i + 1}`);
}

function groupTeamsByMatchday(fixtures: Fixture<string>[], byes: Bye<string>[]): Map<number, string[]> {
  const byMatchday = new Map<number, string[]>();
  const add = (matchday: number, team: string): void => {
    const list = byMatchday.get(matchday) ?? [];
    list.push(team);
    byMatchday.set(matchday, list);
  };
  for (const fixture of fixtures) {
    add(fixture.matchday, fixture.home);
    add(fixture.matchday, fixture.away);
  }
  for (const bye of byes) {
    add(bye.matchday, bye.team);
  }
  return byMatchday;
}

describe('generateRoundRobin', () => {
  it('plays every team against every other team, once at home once away (even N)', () => {
    const teams = teamsOf(4);
    const { fixtures } = generateRoundRobin(teams);
    for (const home of teams) {
      for (const away of teams) {
        if (home === away) continue;
        const matches = fixtures.filter((f) => f.home === home && f.away === away);
        expect(matches).toHaveLength(1);
      }
    }
  });

  it('never repeats a team within one matchday', () => {
    const teams = teamsOf(6);
    const { fixtures, byes } = generateRoundRobin(teams);
    const byMatchday = groupTeamsByMatchday(fixtures, byes);
    for (const teamsThatDay of byMatchday.values()) {
      expect(new Set(teamsThatDay).size).toBe(teamsThatDay.length);
      expect(teamsThatDay).toHaveLength(teams.length);
    }
  });

  it('gives exactly one bye per matchday, and an equal bye count per team (odd N)', () => {
    const teams = teamsOf(5);
    const { fixtures, byes } = generateRoundRobin(teams);
    const matchdays = new Set([...fixtures.map((f) => f.matchday), ...byes.map((b) => b.matchday)]);
    for (const matchday of matchdays) {
      const byesThatDay = byes.filter((b) => b.matchday === matchday);
      expect(byesThatDay).toHaveLength(1);
    }

    const byeCounts = new Map<string, number>();
    for (const bye of byes) {
      byeCounts.set(bye.team, (byeCounts.get(bye.team) ?? 0) + 1);
    }
    expect(byeCounts.size).toBe(teams.length);
    expect(new Set(byeCounts.values()).size).toBe(1);
  });

  it('produces N x (N-1) matches, even or odd team count', () => {
    for (const n of [2, 3, 4, 5, 6, 7]) {
      const { fixtures } = generateRoundRobin(teamsOf(n));
      expect(fixtures).toHaveLength(n * (n - 1));
    }
  });

  it('handles the minimal case, N = 2: one matchday each way', () => {
    const [a, b] = teamsOf(2);
    const { fixtures, byes } = generateRoundRobin([a, b]);
    expect(byes).toHaveLength(0);
    expect(fixtures).toHaveLength(2);
    expect(fixtures).toContainEqual({ matchday: 1, home: a, away: b });
    expect(fixtures).toContainEqual({ matchday: 2, home: b, away: a });
  });

  it('rejects fewer than 2 teams, a deliberate choice, not a spec rule', () => {
    expect(() => generateRoundRobin([])).toThrow(RangeError);
    expect(() => generateRoundRobin(['OnlyTeam'])).toThrow(RangeError);
  });

  it('is deterministic: the same team list and order gives the same schedule', () => {
    const teams = teamsOf(5);
    const first = generateRoundRobin(teams);
    const second = generateRoundRobin(teams);
    expect(second).toEqual(first);
  });
});
