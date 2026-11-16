import { describe, expect, it } from 'vitest';
import type { LeagueWrapper } from '@/domain';
import { HARBORVIEW, leagueWrapper, SALT_MARSH } from '@/test/databaseRecords';
import { leagueOvrOf } from './bracket';
import { getRealOvr, getTeamCondition } from './condition';

/** The test league, with the given levels. */
function withLevels(
  conditions: LeagueWrapper['content']['conditions'],
  wrapper: LeagueWrapper = leagueWrapper()
): LeagueWrapper {
  return { ...wrapper, content: { ...wrapper.content, conditions } };
}

describe('getTeamCondition (Task 226)', () => {
  it('gives the stored level of a team', () => {
    expect(getTeamCondition({ [SALT_MARSH]: 2 }, SALT_MARSH)).toBe(2);
    expect(getTeamCondition({ [SALT_MARSH]: -1 }, SALT_MARSH)).toBe(-1);
  });

  it('gives level 0 for a team with no entry, and for no map', () => {
    expect(getTeamCondition({ [SALT_MARSH]: 2 }, HARBORVIEW)).toBe(0);
    expect(getTeamCondition(undefined, SALT_MARSH)).toBe(0);
  });
});

describe('getRealOvr (Task 226, US-14.1)', () => {
  it('gives the stored OVR with the level of the team', () => {
    // 74 at +2 is 88.8, rounded up. 63 at -2 is 50.4, rounded down.
    expect(getRealOvr(74, { [SALT_MARSH]: 2 }, SALT_MARSH)).toBe(89);
    expect(getRealOvr(63, { [HARBORVIEW]: -2 }, HARBORVIEW)).toBe(50);
  });

  it('gives the stored OVR at level 0', () => {
    expect(getRealOvr(74, undefined, SALT_MARSH)).toBe(74);
    expect(getRealOvr(74, { [HARBORVIEW]: 2 }, SALT_MARSH)).toBe(74);
  });
});

describe('leagueOvrOf with the condition (Task 226, US-14.2)', () => {
  it('gives the real OVR of each team of the league', () => {
    const ovrOf = leagueOvrOf(withLevels({ [SALT_MARSH]: 1, [HARBORVIEW]: -1 }));
    expect(ovrOf(SALT_MARSH)).toBe(82);
    expect(ovrOf(HARBORVIEW)).toBe(56);
  });

  it('gives the stored OVR for a league with no levels', () => {
    const ovrOf = leagueOvrOf(leagueWrapper());
    expect(ovrOf(SALT_MARSH)).toBe(74);
    expect(ovrOf(HARBORVIEW)).toBe(63);
  });
});
