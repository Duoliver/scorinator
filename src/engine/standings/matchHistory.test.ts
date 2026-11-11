import { describe, expect, it } from 'vitest';
import { getLastResults, getPlacesByMatchday } from './matchHistory';
import type { MatchResult, PointsConfig } from './types';

const POINTS: PointsConfig = { win: 3, draw: 1, loss: 0 };

type Played = MatchResult<string> & { fixtureId: string };

const fixture = (id: string, matchday: number): { id: string; matchday: number } => ({
  id,
  matchday,
});
const played = (
  fixtureId: string,
  home: string,
  away: string,
  homeGoals: number,
  awayGoals: number
): Played => ({ fixtureId, home, away, homeGoals, awayGoals });

describe('getLastResults (US-12.1, Task 153)', () => {
  const FIXTURES = [1, 2, 3, 4, 5, 6, 7].map((md) => fixture(`f${md}`, md));

  it('gives each field from the view of the team', () => {
    const results = [played('f1', 'a', 'b', 2, 1), played('f2', 'c', 'a', 3, 0)];
    expect(getLastResults('a', FIXTURES, results, 5)).toEqual([
      {
        outcome: 'W',
        opponent: 'b',
        isHome: true,
        goalsFor: 2,
        goalsAgainst: 1,
        matchday: 1,
      },
      {
        outcome: 'L',
        opponent: 'c',
        isHome: false,
        goalsFor: 0,
        goalsAgainst: 3,
        matchday: 2,
      },
    ]);
  });

  it('marks a draw', () => {
    const results = [played('f1', 'a', 'b', 1, 1)];
    expect(getLastResults('b', FIXTURES, results, 5)[0].outcome).toBe('D');
  });

  it('uses the matchday order, not the order of the results', () => {
    const results = [
      played('f3', 'a', 'b', 1, 0),
      played('f1', 'a', 'c', 1, 0),
      played('f2', 'a', 'd', 1, 0),
    ];
    expect(getLastResults('a', FIXTURES, results, 5).map((r) => r.matchday)).toEqual([
      1, 2, 3,
    ]);
  });

  it('gives only the last N, the oldest first', () => {
    const results = FIXTURES.map((f) => played(f.id, 'a', 'b', 1, 0));
    expect(getLastResults('a', FIXTURES, results, 5).map((r) => r.matchday)).toEqual([
      3, 4, 5, 6, 7,
    ]);
  });

  it('gives fewer entries for a team with fewer matches', () => {
    const results = [played('f1', 'a', 'b', 1, 0)];
    expect(getLastResults('a', FIXTURES, results, 5)).toHaveLength(1);
  });

  it('gives an empty list for a team with no match, and for N = 0', () => {
    const results = [played('f1', 'a', 'b', 1, 0)];
    expect(getLastResults('z', FIXTURES, results, 5)).toEqual([]);
    expect(getLastResults('a', FIXTURES, results, 0)).toEqual([]);
  });

  it('does not count a result with no fixture in the list', () => {
    const results = [played('f1', 'a', 'b', 1, 0), played('other', 'a', 'c', 1, 0)];
    expect(getLastResults('a', FIXTURES, results, 5)).toHaveLength(1);
  });

  it('leaves its input alone', () => {
    const results = Object.freeze([
      played('f2', 'a', 'b', 1, 0),
      played('f1', 'a', 'c', 1, 0),
    ]);
    expect(() =>
      getLastResults('a', Object.freeze([...FIXTURES]), results, 5)
    ).not.toThrow();
  });
});

describe('getPlacesByMatchday (US-12.4, Task 153)', () => {
  const TEAMS = ['a', 'b', 'c', 'd'];
  const FIXTURES = [
    fixture('m1a', 1),
    fixture('m1b', 1),
    fixture('m2a', 2),
    fixture('m2b', 2),
    fixture('m3a', 3),
    fixture('m4a', 4),
  ];
  const placesOf = (places: ReadonlyMap<string, number>): Record<string, number> =>
    Object.fromEntries(places);

  it('gives nothing with no result', () => {
    expect(getPlacesByMatchday(TEAMS, FIXTURES, [], POINTS)).toEqual([]);
  });

  it('adds the results of each matchday to the ones before it', () => {
    const results = [
      played('m1a', 'a', 'b', 2, 0),
      played('m1b', 'c', 'd', 1, 1),
      played('m2a', 'a', 'c', 0, 3),
      played('m2b', 'b', 'd', 1, 0),
    ];
    const points = getPlacesByMatchday(TEAMS, FIXTURES, results, POINTS);
    expect(points.map((point) => point.matchday)).toEqual([1, 2]);
    expect(placesOf(points[0].places)).toEqual({ a: 1, c: 2, d: 3, b: 4 });
    expect(placesOf(points[1].places)).toEqual({ c: 1, a: 2, b: 3, d: 4 });
  });

  it('counts a matchday with at least one result, and skips one with none', () => {
    const results = [played('m1a', 'a', 'b', 1, 0), played('m4a', 'c', 'd', 1, 0)];
    const points = getPlacesByMatchday(TEAMS, FIXTURES, results, POINTS);
    expect(points.map((point) => point.matchday)).toEqual([1, 4]);
  });

  it('does not depend on the order of the results', () => {
    const results = [played('m2a', 'a', 'c', 0, 3), played('m1a', 'a', 'b', 2, 0)];
    const points = getPlacesByMatchday(TEAMS, FIXTURES, results, POINTS);
    expect(points.map((point) => point.matchday)).toEqual([1, 2]);
    expect(placesOf(points[0].places).a).toBe(1);
  });

  it('gives each team a place, also a team with no match', () => {
    const results = [played('m1a', 'a', 'b', 1, 0)];
    const [point] = getPlacesByMatchday(TEAMS, FIXTURES, results, POINTS);
    expect([...point.places.values()].sort()).toEqual([1, 2, 3, 4]);
    expect(point.places.has('c')).toBe(true);
  });

  it('gives teams that share a place their row order, with no repeat (choice 5)', () => {
    const results = [played('m1a', 'a', 'b', 0, 0)];
    const [point] = getPlacesByMatchday(['a', 'b'], FIXTURES, results, POINTS);
    expect(placesOf(point.places)).toEqual({ a: 1, b: 2 });
  });

  it('uses the fixed lots for a full tie', () => {
    const results = [played('m1a', 'a', 'b', 0, 0)];
    const lotOf = (team: string): number => (team === 'b' ? 1 : 2);
    const [point] = getPlacesByMatchday(['a', 'b'], FIXTURES, results, POINTS, lotOf);
    expect(placesOf(point.places)).toEqual({ b: 1, a: 2 });
  });

  it('does not count a result of another group (choice 2)', () => {
    const results = [played('m1a', 'a', 'b', 1, 0), played('other', 'x', 'y', 5, 0)];
    const points = getPlacesByMatchday(['a', 'b'], FIXTURES, results, POINTS);
    expect(points).toHaveLength(1);
    expect(placesOf(points[0].places)).toEqual({ a: 1, b: 2 });
  });
});
