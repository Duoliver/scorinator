import { describe, expect, it } from 'vitest';
import {
  findPhaseCurrentMatchday,
  findPhaseResult,
  isPhaseMatchdayPlayed,
} from './schedule';
import type { PhaseFixture } from './types';

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
});
