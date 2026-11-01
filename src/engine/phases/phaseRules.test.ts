import { describe, expect, it } from 'vitest';
import {
  checkPhaseChain,
  checkPhaseFit,
  qualifierCount,
  suggestBestM,
  type BracketPlan,
  type GroupsPlan,
  type PhasePlan,
  type RoundRobinPlan,
} from './index';

const roundRobin = (top?: number): RoundRobinPlan => ({
  format: 'round-robin',
  legs: 'two-way',
  ...(top === undefined ? {} : { advance: { top } }),
});

const groups = (
  grouping: GroupsPlan['grouping'],
  top?: number,
  bestOfNext = 0
): GroupsPlan => ({
  format: 'groups',
  legs: 'single-duels',
  grouping,
  ...(top === undefined ? {} : { advance: { top, bestOfNext } }),
});

const bracket: BracketPlan = { format: 'bracket' };

describe('checkPhaseChain (US-01.3)', () => {
  it('accepts a one-phase round robin, Groups, or bracket league', () => {
    expect(checkPhaseChain([roundRobin()])).toEqual([]);
    expect(checkPhaseChain([groups({ by: 'size', size: 4 })])).toEqual([]);
    expect(checkPhaseChain([bracket])).toEqual([]);
  });

  it('accepts Groups then a bracket, and three phases', () => {
    expect(checkPhaseChain([groups({ by: 'count', count: 4 }, 2), bracket])).toEqual(
      []
    );
    expect(
      checkPhaseChain([roundRobin(8), groups({ by: 'size', size: 4 }, 2), bracket])
    ).toEqual([]);
  });

  it('gives no-phases for an empty list', () => {
    expect(checkPhaseChain([])).toEqual([{ code: 'no-phases' }]);
  });

  it('gives bracket-not-last for a bracket before the last phase', () => {
    expect(checkPhaseChain([bracket, roundRobin()])).toEqual([
      { code: 'bracket-not-last', phase: 1 },
    ]);
    expect(checkPhaseChain([roundRobin(4), bracket, bracket])).toEqual([
      { code: 'bracket-not-last', phase: 2 },
    ]);
  });

  it('gives missing-advancement for a phase before the last with no advancement', () => {
    expect(checkPhaseChain([roundRobin(), roundRobin()])).toEqual([
      { code: 'missing-advancement', phase: 1 },
    ]);
  });

  it('gives advancement-on-last for an advancement on the last phase', () => {
    expect(checkPhaseChain([roundRobin(4)])).toEqual([
      { code: 'advancement-on-last', phase: 1 },
    ]);
  });
});

describe('qualifierCount (US-01.4, US-01.6)', () => {
  it('gives top N for a round robin', () => {
    expect(qualifierCount(roundRobin(6), 1)).toBe(6);
  });

  it('gives groups × top + M for Groups', () => {
    expect(qualifierCount(groups({ by: 'count', count: 4 }, 2), 4)).toBe(8);
    expect(qualifierCount(groups({ by: 'count', count: 6 }, 2, 4), 6)).toBe(16);
  });

  it('throws a RangeError for a plan with no advancement', () => {
    expect(() => qualifierCount(roundRobin(), 1)).toThrow(RangeError);
    expect(() => qualifierCount(bracket, 1)).toThrow(RangeError);
  });
});

describe('suggestBestM (US-01.6)', () => {
  it('gives the smallest M that makes the count a power of 2', () => {
    expect(suggestBestM(6, 2, 4)).toBe(4); // 12 + 4 = 16
    expect(suggestBestM(3, 2, 4)).toBe(2); // 6 + 2 = 8
    expect(suggestBestM(5, 3, 4)).toBe(1); // 15 + 1 = 16
  });

  it('gives undefined when the count is already a power of 2', () => {
    expect(suggestBestM(4, 2, 4)).toBeUndefined();
  });

  it('gives undefined when no M that fits gives a power of 2', () => {
    // 5 groups × top 2 = 10. M can be 1 to 4, which gives 11 to 14.
    expect(suggestBestM(5, 2, 4)).toBeUndefined();
    // With top 2 and a smallest group of 2, place 3 does not exist, so no
    // M fits.
    expect(suggestBestM(6, 2, 2)).toBeUndefined();
  });
});

describe('checkPhaseFit (US-01.4, US-01.6, US-02.1)', () => {
  it('accepts a fitting league: 16 teams, 4 groups of 4, top 2, then a bracket of 8', () => {
    expect(checkPhaseFit([groups({ by: 'size', size: 4 }, 2), bracket], 16)).toEqual(
      []
    );
  });

  it('accepts an MVP1-style league: one round robin', () => {
    expect(checkPhaseFit([roundRobin()], 8)).toEqual([]);
  });

  it('gives too-few-teams for a phase that gets fewer than 2 teams', () => {
    expect(checkPhaseFit([roundRobin()], 1)).toEqual([
      { code: 'too-few-teams', phase: 1, teams: 1 },
    ]);
    expect(checkPhaseFit([roundRobin()], 0)).toEqual([
      { code: 'too-few-teams', phase: 1, teams: 0 },
    ]);
  });

  it('gives top-out-of-range for a round robin top below 1, at the team count, or above it', () => {
    for (const top of [0, 8, 9, 1.5]) {
      expect(checkPhaseFit([roundRobin(top), bracket], 8)).toContainEqual({
        code: 'top-out-of-range',
        phase: 1,
        top,
        max: 7,
      });
    }
    expect(checkPhaseFit([roundRobin(7), roundRobin()], 8)).toEqual([]);
  });

  it('gives top-out-of-range for a Groups top at the smallest group size', () => {
    // 18 teams with size 4: 4, 4, 4, 3, 3. The smallest group has 3 teams.
    const problems = checkPhaseFit([groups({ by: 'size', size: 4 }, 3), bracket], 18);
    expect(problems).toContainEqual({
      code: 'top-out-of-range',
      phase: 1,
      top: 3,
      max: 2,
    });
    expect(checkPhaseFit([groups({ by: 'size', size: 4 }, 2), bracket], 18)).toEqual(
      []
    );
  });

  it('uses the real phase-1 group sizes when it has them (choice 4)', () => {
    // A move made the groups 5, 4, 2, 5 out of 16 teams.
    const problems = checkPhaseFit(
      [groups({ by: 'size', size: 4 }, 2), bracket],
      16,
      [5, 4, 2, 5]
    );
    expect(problems).toContainEqual({
      code: 'top-out-of-range',
      phase: 1,
      top: 2,
      max: 1,
    });
  });

  it('gives group-too-small for each group with fewer than 2 teams', () => {
    // Count mode: 5 teams in 4 groups give 2, 1, 1, 1.
    expect(checkPhaseFit([groups({ by: 'count', count: 4 })], 5)).toEqual([
      { code: 'group-too-small', phase: 1, group: 2, teams: 1 },
      { code: 'group-too-small', phase: 1, group: 3, teams: 1 },
      { code: 'group-too-small', phase: 1, group: 4, teams: 1 },
    ]);
    // A move left a group with 1 team.
    expect(
      checkPhaseFit([groups({ by: 'size', size: 4 })], 8, [4, 3, 1])
    ).toContainEqual({ code: 'group-too-small', phase: 1, group: 3, teams: 1 });
  });

  it('accepts one group in size mode (choice 5)', () => {
    expect(checkPhaseFit([groups({ by: 'size', size: 4 })], 4)).toEqual([]);
  });

  it('gives grouping-out-of-range for a size or count below 2', () => {
    expect(checkPhaseFit([groups({ by: 'size', size: 1 })], 8)).toEqual([
      { code: 'grouping-out-of-range', phase: 1 },
    ]);
    expect(checkPhaseFit([groups({ by: 'count', count: 0 })], 8)).toEqual([
      { code: 'grouping-out-of-range', phase: 1 },
    ]);
  });

  it('gives best-m-out-of-range for M above the group count minus 1, or below 0', () => {
    // 4 groups of 4, top 2: M can be 0 to 3.
    expect(
      checkPhaseFit([groups({ by: 'count', count: 4 }, 2, 3), bracket], 16)
    ).toEqual([]);
    for (const m of [4, -1, 1.5]) {
      expect(
        checkPhaseFit([groups({ by: 'count', count: 4 }, 2, m), bracket], 16)
      ).toContainEqual({
        code: 'best-m-out-of-range',
        phase: 1,
        bestOfNext: m,
        max: 3,
      });
    }
  });

  it('gives best-m-place-missing when place N + 1 does not exist in the smallest group', () => {
    // 4 groups of 2, top 2, best 1 of place 3: no group has a place 3.
    expect(
      checkPhaseFit([groups({ by: 'count', count: 4 }, 2, 1), bracket], 8)
    ).toContainEqual({ code: 'best-m-place-missing', phase: 1, place: 3 });
  });

  it('counts the teams of each later phase from the qualifiers of the phase before it', () => {
    // 16 teams → 4 groups × top 1 = 4 → a round robin with top 4 does not
    // fit (it needs top 3 or less) → the bracket gets 4.
    expect(
      checkPhaseFit([groups({ by: 'count', count: 4 }, 1), roundRobin(4), bracket], 16)
    ).toEqual([{ code: 'top-out-of-range', phase: 2, top: 4, max: 3 }]);
  });

  it('gives too-few-teams for a later phase that gets 1 team', () => {
    expect(checkPhaseFit([roundRobin(1), bracket], 8)).toEqual([
      { code: 'too-few-teams', phase: 2, teams: 1 },
    ]);
  });

  it('checks a later Groups phase with groupSizes from its team count', () => {
    // 8 qualifiers into groups of size 3: 3, 3, 2. Top 1 fits, top 2 does not.
    const phases = (top: number): PhasePlan[] => [
      roundRobin(8),
      groups({ by: 'size', size: 3 }, top),
      bracket,
    ];
    expect(checkPhaseFit(phases(1), 10)).toEqual([]);
    expect(checkPhaseFit(phases(2), 10)).toContainEqual({
      code: 'top-out-of-range',
      phase: 2,
      top: 2,
      max: 1,
    });
  });

  it('stops at a phase with no advancement, since the next count is not known', () => {
    expect(checkPhaseFit([roundRobin(), roundRobin(2)], 8)).toEqual([]);
  });
});
