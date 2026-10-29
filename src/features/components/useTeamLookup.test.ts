import { beforeEach, describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/preact';
import { updateTeamBlueprint } from '@/app/state/teamBlueprintActions';
import type { TeamRecord } from '@/domain';
import { useTeamLookup } from './useTeamLookup';
import { openTestDatabase, testUuid } from '@/test/databaseRecords';

const team = (overrides: Partial<TeamRecord> = {}): TeamRecord => ({
  slug: 'fc-united',
  name: 'FC United',
  colour: '#E53935',
  tier: 'B',
  ...overrides,
});

beforeEach(() => {
  openTestDatabase([]);
});

describe('useTeamLookup', () => {
  it('gives the name and colour of a roster team by slug', () => {
    openTestDatabase([
      team(),
      team({ slug: 'fc-rivals', name: 'FC Rivals', colour: '#1E88E5' }),
    ]);
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

  it('keeps the same function while the Blueprints do not change', () => {
    openTestDatabase([team()]);
    const { result, rerender } = renderHook(() => useTeamLookup());
    const first = result.current;

    rerender();

    expect(result.current).toBe(first);
  });

  it('gives a new function that sees the change when the Blueprints change', () => {
    openTestDatabase([team()]);
    const { result } = renderHook(() => useTeamLookup());
    const first = result.current;

    act(() => updateTeamBlueprint(testUuid(1), { name: 'FC United Renamed' }));

    expect(result.current).not.toBe(first);
    expect(result.current('fc-united').name).toBe('FC United Renamed');
  });
});
