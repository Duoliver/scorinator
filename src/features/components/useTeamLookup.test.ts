import { beforeEach, describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/preact';
import { setTeams } from '@/app/state/teamsActions';
import { useTeamsStore } from '@/app/state/teamsStore';
import type { TeamRecord } from './types';
import { useTeamLookup } from './useTeamLookup';

const team = (overrides: Partial<TeamRecord> = {}): TeamRecord => ({
  slug: 'fc-united',
  name: 'FC United',
  colour: '#E53935',
  tier: 'B',
  ...overrides,
});

beforeEach(() => {
  useTeamsStore.setState({ teams: [] });
});

describe('useTeamLookup', () => {
  it('gives the name and colour of a roster team by slug', () => {
    useTeamsStore.setState({
      teams: [
        team(),
        team({ slug: 'fc-rivals', name: 'FC Rivals', colour: '#1E88E5' }),
      ],
    });
    const { result } = renderHook(() => useTeamLookup());

    expect(result.current('fc-rivals')).toEqual({
      name: 'FC Rivals',
      colour: '#1E88E5',
    });
  });

  it('falls back to the slug and no colour for a team not in the roster', () => {
    const { result } = renderHook(() => useTeamLookup());

    expect(result.current('fc-gone')).toEqual({ name: 'fc-gone', colour: '' });
  });

  it('keeps the same function while the roster does not change', () => {
    useTeamsStore.setState({ teams: [team()] });
    const { result, rerender } = renderHook(() => useTeamLookup());
    const first = result.current;

    rerender();

    expect(result.current).toBe(first);
  });

  it('gives a new function that sees the change when the roster changes', () => {
    useTeamsStore.setState({ teams: [team()] });
    const { result } = renderHook(() => useTeamLookup());
    const first = result.current;

    act(() => setTeams([team({ name: 'FC United Renamed' })]));

    expect(result.current).not.toBe(first);
    expect(result.current('fc-united').name).toBe('FC United Renamed');
  });
});
