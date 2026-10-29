import { describe, expect, it } from 'vitest';
import {
  findCurrentMatchday,
  findPhaseCurrentMatchday,
  findPhaseResult,
  findResult,
  isMatchdayFullyPlayed,
  isPhaseMatchdayPlayed,
  isSameMatch,
  matchKey,
} from './schedule';
import type { Fixture, PhaseFixture } from './types';

interface Result extends Fixture<string> {
  homeGoals: number;
  awayGoals: number;
}

const fixtures: Fixture<string>[] = [
  { matchday: 1, home: 'fc-united', away: 'fc-rivals' },
  { matchday: 1, home: 'fc-town', away: 'fc-rangers' },
  { matchday: 2, home: 'fc-rivals', away: 'fc-town' },
];

const result = (overrides: Partial<Result> = {}): Result => ({
  matchday: 1,
  home: 'fc-united',
  away: 'fc-rivals',
  homeGoals: 2,
  awayGoals: 1,
  ...overrides,
});

describe('isSameMatch', () => {
  it('is true for the same matchday, home, and away', () => {
    expect(isSameMatch(result(), fixtures[0])).toBe(true);
  });

  it('is false when only the matchday differs', () => {
    expect(isSameMatch(result({ matchday: 2 }), fixtures[0])).toBe(false);
  });

  it('is false for the reverse fixture, with home and away swapped', () => {
    expect(
      isSameMatch(result({ home: 'fc-rivals', away: 'fc-united' }), fixtures[0])
    ).toBe(false);
  });
});

describe('matchKey', () => {
  it('gives the same key for a fixture and its result', () => {
    expect(matchKey(result())).toBe(matchKey(fixtures[0]));
  });

  it('gives two keys for two team pairs that join to the same text', () => {
    const a = { matchday: 1, home: 'fc', away: 'a-b' };
    const b = { matchday: 1, home: 'fc-a', away: 'b' };
    expect(matchKey(a)).not.toBe(matchKey(b));
  });
});

describe('findResult', () => {
  it('returns the result of the fixture', () => {
    const played = result();
    expect(findResult([played], fixtures[0])).toBe(played);
  });

  it('returns undefined for a fixture with no result', () => {
    expect(findResult([], fixtures[0])).toBeUndefined();
  });

  it('does not match a result from another matchday, even with the same teams', () => {
    expect(findResult([result({ matchday: 2 })], fixtures[0])).toBeUndefined();
  });
});

describe('isMatchdayFullyPlayed', () => {
  it('is false when at least one fixture on the matchday has no result', () => {
    expect(isMatchdayFullyPlayed(fixtures, [result()], 1)).toBe(false);
  });

  it('is true once every fixture on the matchday has a result', () => {
    const both = [
      result(),
      result({ home: 'fc-town', away: 'fc-rangers', homeGoals: 0, awayGoals: 0 }),
    ];
    expect(isMatchdayFullyPlayed(fixtures, both, 1)).toBe(true);
  });

  it('is true for a matchday with no fixtures at all', () => {
    expect(isMatchdayFullyPlayed([], [], 5)).toBe(true);
  });
});

describe('findCurrentMatchday', () => {
  const matchdayOne = [
    result(),
    result({ home: 'fc-town', away: 'fc-rangers', homeGoals: 0, awayGoals: 0 }),
  ];
  const matchdayTwo = result({ matchday: 2, home: 'fc-rivals', away: 'fc-town' });

  it('is the first matchday when nothing is played', () => {
    expect(findCurrentMatchday(fixtures, [])).toBe(1);
  });

  it('moves to the next matchday once the first is fully played', () => {
    expect(findCurrentMatchday(fixtures, matchdayOne)).toBe(2);
  });

  it('stays on a matchday that is only partly played', () => {
    expect(findCurrentMatchday(fixtures, [result()])).toBe(1);
  });

  it('is the earliest unplayed matchday when a later one was played first', () => {
    expect(findCurrentMatchday(fixtures, [matchdayTwo])).toBe(1);
  });

  it('is undefined once every fixture has a result', () => {
    expect(
      findCurrentMatchday(fixtures, [...matchdayOne, matchdayTwo])
    ).toBeUndefined();
  });

  it('is undefined for a schedule with no fixtures', () => {
    expect(findCurrentMatchday([], [])).toBeUndefined();
  });
});

describe('the lookups by fixture id', () => {
  interface PhaseResult {
    fixtureId: string;
    homeGoals: number;
    awayGoals: number;
  }

  const phaseFixtures: PhaseFixture<string>[] = [
    { id: 'p1.g1.md1.m1', matchday: 1, home: 'fc-united', away: 'fc-rivals' },
    { id: 'p1.g1.md1.m2', matchday: 1, home: 'fc-town', away: 'fc-rangers' },
    { id: 'p1.g1.md2.m1', matchday: 2, home: 'fc-rivals', away: 'fc-town' },
  ];

  const played = (fixtureId: string): PhaseResult => ({
    fixtureId,
    homeGoals: 1,
    awayGoals: 0,
  });

  describe('findPhaseResult', () => {
    it('returns the result with the fixture id', () => {
      const results = [played('p1.g1.md1.m2'), played('p1.g1.md1.m1')];
      expect(findPhaseResult(results, phaseFixtures[0])).toBe(results[1]);
    });

    it('returns undefined when the fixture has no result', () => {
      expect(
        findPhaseResult([played('p1.g1.md1.m2')], phaseFixtures[0])
      ).toBeUndefined();
    });

    it('tells two matches with the same matchday and teams apart, by the id', () => {
      // Two groups share matchday numbers, and a later phase can repeat a pairing.
      const sameTeams = { matchday: 1, home: 'fc-united', away: 'fc-rivals' };
      const phase2 = { id: 'p2.g1.md1.m1', ...sameTeams };
      const results = [played('p1.g1.md1.m1')];
      expect(findPhaseResult(results, phase2)).toBeUndefined();
    });
  });

  describe('isPhaseMatchdayPlayed', () => {
    it('is false while a fixture of the matchday has no result', () => {
      expect(isPhaseMatchdayPlayed(phaseFixtures, [played('p1.g1.md1.m1')], 1)).toBe(
        false
      );
    });

    it('is true when each fixture of the matchday has a result', () => {
      const results = [played('p1.g1.md1.m1'), played('p1.g1.md1.m2')];
      expect(isPhaseMatchdayPlayed(phaseFixtures, results, 1)).toBe(true);
    });

    it('is true for a matchday with no fixtures', () => {
      expect(isPhaseMatchdayPlayed(phaseFixtures, [], 9)).toBe(true);
    });
  });

  describe('findPhaseCurrentMatchday', () => {
    it('returns the lowest matchday with an unplayed fixture', () => {
      expect(findPhaseCurrentMatchday(phaseFixtures, [played('p1.g1.md1.m1')])).toBe(1);
    });

    it('returns a skipped earlier matchday', () => {
      expect(findPhaseCurrentMatchday(phaseFixtures, [played('p1.g1.md2.m1')])).toBe(1);
    });

    it('moves on when a matchday is fully played', () => {
      const results = [played('p1.g1.md1.m1'), played('p1.g1.md1.m2')];
      expect(findPhaseCurrentMatchday(phaseFixtures, results)).toBe(2);
    });

    it('returns undefined when every fixture has a result, or there are no fixtures', () => {
      const results = phaseFixtures.map((fixture) => played(fixture.id));
      expect(findPhaseCurrentMatchday(phaseFixtures, results)).toBeUndefined();
      expect(findPhaseCurrentMatchday([], [])).toBeUndefined();
    });
  });

  it('gives the same answers as the MVP1 lookups on the same schedule', () => {
    const mvp1Results = [{ ...phaseFixtures[0], homeGoals: 1, awayGoals: 0 }];
    const phaseResults = [played(phaseFixtures[0].id)];
    for (const matchday of [1, 2, 3]) {
      expect(isPhaseMatchdayPlayed(phaseFixtures, phaseResults, matchday)).toBe(
        isMatchdayFullyPlayed(phaseFixtures, mvp1Results, matchday)
      );
    }
    expect(findPhaseCurrentMatchday(phaseFixtures, phaseResults)).toBe(
      findCurrentMatchday(phaseFixtures, mvp1Results)
    );
  });
});
