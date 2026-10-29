import { describe, expect, it } from 'vitest';
import { findCurrentPhase } from './currentPhase';
import { leagueWrapper } from '@/test/databaseRecords';

describe('findCurrentPhase', () => {
  it('gives the last phase of the league in M1', () => {
    const wrapper = leagueWrapper();

    expect(findCurrentPhase(wrapper)).toBe(wrapper.content.phases[0]);
  });

  it('gives undefined for a league with no phase', () => {
    const wrapper = leagueWrapper();
    const empty = { ...wrapper, content: { ...wrapper.content, phases: [] } };

    expect(findCurrentPhase(empty)).toBeUndefined();
  });
});
