import { describe, expect, it } from 'vitest';
import { assignFixtureIds, generateRoundRobin, generateSingleDuels } from './index';
import { createSeededRng } from '@/engine/rng';
import type { Fixture } from './types';

function teamsOf(n: number): string[] {
  return Array.from({ length: n }, (_, i) => `T${i + 1}`);
}

const pairKey = (x: string, y: string): string => (x < y ? `${x}|${y}` : `${y}|${x}`);

function homeAwayCounts(
  fixtures: readonly Fixture<string>[]
): Map<string, { home: number; away: number }> {
  const counts = new Map<string, { home: number; away: number }>();
  const entry = (team: string): { home: number; away: number } => {
    const found = counts.get(team) ?? { home: 0, away: 0 };
    counts.set(team, found);
    return found;
  };
  for (const fixture of fixtures) {
    entry(fixture.home).home++;
    entry(fixture.away).away++;
  }
  return counts;
}

const TEAM_COUNTS = Array.from({ length: 19 }, (_, i) => i + 2); // 2 to 20

describe('generateSingleDuels', () => {
  it('rejects fewer than 2 teams, as generateRoundRobin does', () => {
    expect(() => generateSingleDuels([], createSeededRng(1))).toThrow(RangeError);
    expect(() => generateSingleDuels(['OnlyTeam'], createSeededRng(1))).toThrow(
      RangeError
    );
  });

  it('plays each pair of teams once, for N from 2 to 20', () => {
    for (const n of TEAM_COUNTS) {
      const teams = teamsOf(n);
      const { fixtures } = generateSingleDuels(teams, createSeededRng(n));
      expect(fixtures).toHaveLength((n * (n - 1)) / 2);
      const pairs = new Set(fixtures.map((f) => pairKey(f.home, f.away)));
      expect(pairs.size).toBe(fixtures.length);
      for (const fixture of fixtures) expect(fixture.home).not.toBe(fixture.away);
    }
  });

  it('has N - 1 matchdays for an even N, and N matchdays with one bye each for an odd N', () => {
    for (const n of TEAM_COUNTS) {
      const { fixtures, byes } = generateSingleDuels(teamsOf(n), createSeededRng(n));
      const matchdayCount = n % 2 === 0 ? n - 1 : n;
      for (let matchday = 1; matchday <= matchdayCount; matchday++) {
        const playing = fixtures
          .filter((f) => f.matchday === matchday)
          .flatMap((f) => [f.home, f.away]);
        const resting = byes.filter((b) => b.matchday === matchday).map((b) => b.team);
        expect(resting).toHaveLength(n % 2);
        expect(new Set([...playing, ...resting]).size).toBe(n);
        expect(playing.length + resting.length).toBe(n);
      }
      const lastMatchday = Math.max(...fixtures.map((f) => f.matchday));
      expect(lastMatchday).toBe(matchdayCount);
    }
  });

  it('takes its pairings and byes from the circle method, in the team order: the first leg of generateRoundRobin', () => {
    for (const n of TEAM_COUNTS) {
      const teams = teamsOf(n);
      const twoWay = generateRoundRobin(teams);
      const legOneMatchdays = n % 2 === 0 ? n - 1 : n;
      const expectedPairs = twoWay.fixtures
        .filter((f) => f.matchday <= legOneMatchdays)
        .map((f) => `${f.matchday}:${pairKey(f.home, f.away)}`)
        .sort();
      const expectedByes = twoWay.byes.filter((b) => b.matchday <= legOneMatchdays);

      const single = generateSingleDuels(teams, createSeededRng(n + 100));
      const pairs = single.fixtures
        .map((f) => `${f.matchday}:${pairKey(f.home, f.away)}`)
        .sort();
      expect(pairs).toEqual(expectedPairs);
      expect(single.byes).toEqual(expectedByes);
    }
  });

  it('keeps each team home and away counts within 1, and equal for an odd N (N 2 to 20, 200 seeds)', () => {
    for (const n of TEAM_COUNTS) {
      for (let seed = 1; seed <= 200; seed++) {
        const { fixtures } = generateSingleDuels(teamsOf(n), createSeededRng(seed));
        for (const { home, away } of homeAwayCounts(fixtures).values()) {
          const gap = Math.abs(home - away);
          expect(gap).toBe(n % 2 === 0 ? 1 : 0);
        }
      }
    }
  });

  it('lets the rng pick the teams with the extra home match for an even N: each team gets it in 40% to 60% of 2,000 seeds', () => {
    for (const n of [2, 4, 6, 10]) {
      const extraHome = new Map<string, number>();
      for (let seed = 1; seed <= 2000; seed++) {
        const { fixtures } = generateSingleDuels(teamsOf(n), createSeededRng(seed));
        for (const [team, { home, away }] of homeAwayCounts(fixtures)) {
          if (home > away) extraHome.set(team, (extraHome.get(team) ?? 0) + 1);
        }
      }
      for (const team of teamsOf(n)) {
        const share = (extraHome.get(team) ?? 0) / 2000;
        expect(share).toBeGreaterThanOrEqual(0.4);
        expect(share).toBeLessThanOrEqual(0.6);
      }
    }
  });

  it('makes each side of each pairing home in 40% to 60% of 2,000 seeds (N 2 to 20)', () => {
    for (const n of TEAM_COUNTS) {
      const homeWins = new Map<string, number>();
      for (let seed = 1; seed <= 2000; seed++) {
        const { fixtures } = generateSingleDuels(teamsOf(n), createSeededRng(seed));
        for (const fixture of fixtures) {
          const key = pairKey(fixture.home, fixture.away);
          // Count the seeds where the lower-sorted team of the pair is home.
          if (key.startsWith(`${fixture.home}|`)) {
            homeWins.set(key, (homeWins.get(key) ?? 0) + 1);
          } else if (!homeWins.has(key)) {
            homeWins.set(key, 0);
          }
        }
      }
      expect(homeWins.size).toBe((n * (n - 1)) / 2);
      for (const count of homeWins.values()) {
        expect(count / 2000).toBeGreaterThanOrEqual(0.4);
        expect(count / 2000).toBeLessThanOrEqual(0.6);
      }
    }
  });

  it('gives the same schedule for the same seed, and another schedule for another seed', () => {
    const first = generateSingleDuels(teamsOf(8), createSeededRng(123));
    const second = generateSingleDuels(teamsOf(8), createSeededRng(123));
    const other = generateSingleDuels(teamsOf(8), createSeededRng(124));
    expect(second).toEqual(first);
    expect(other).not.toEqual(first);
  });

  it('keeps the fixtures in matchday order', () => {
    const { fixtures } = generateSingleDuels(teamsOf(9), createSeededRng(7));
    const matchdays = fixtures.map((fixture) => fixture.matchday);
    expect(matchdays).toEqual([...matchdays].sort((x, y) => x - y));
  });

  it('shuffles the match order inside each matchday: the first team is not always in the first match', () => {
    // The circle method keeps T1 in the first match of every matchday. With
    // 8 teams (4 matches a matchday), a fair shuffle puts T1 first in about
    // 1 matchday of 4. 200 seeds x 7 matchdays.
    let firstMatchdays = 0;
    let total = 0;
    for (let seed = 1; seed <= 200; seed++) {
      const { fixtures } = generateSingleDuels(teamsOf(8), createSeededRng(seed));
      for (let matchday = 1; matchday <= 7; matchday++) {
        const first = fixtures.find((fixture) => fixture.matchday === matchday);
        total++;
        if (first?.home === 'T1' || first?.away === 'T1') firstMatchdays++;
      }
    }
    const share = firstMatchdays / total;
    expect(share).toBeGreaterThan(0.2);
    expect(share).toBeLessThan(0.3);
  });

  it('gives fixtures that assignFixtureIds can number', () => {
    const { fixtures } = generateSingleDuels(teamsOf(5), createSeededRng(3));
    const withIds = assignFixtureIds(fixtures, { phase: 2, group: 1 });
    expect(new Set(withIds.map((f) => f.id)).size).toBe(fixtures.length);
    expect(withIds[0].id).toBe('p2.g1.md1.m1');
  });

  it('does not change its input', () => {
    const teams = teamsOf(6);
    generateSingleDuels(teams, createSeededRng(5));
    expect(teams).toEqual(teamsOf(6));
  });
});
