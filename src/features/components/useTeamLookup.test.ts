import { beforeEach, describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/preact';
import { useDatabaseStore } from '@/app/state/databaseStore';
import {
  blueprint,
  HARBORVIEW,
  instance,
  openTestDatabase,
  SALT_MARSH,
} from '@/test/databaseRecords';
import { useTeamLookup } from './useTeamLookup';

const teams = [
  instance(),
  instance({ blueprintUuid: HARBORVIEW, name: 'Harborview SC', colour: '#E53935' }),
];

beforeEach(() => {
  openTestDatabase();
});

describe('useTeamLookup', () => {
  it('gives the name and colour of a league Instance by its Blueprint UUID', () => {
    const { result } = renderHook(() => useTeamLookup(teams));

    expect(result.current(HARBORVIEW)).toEqual({
      name: 'Harborview SC',
      colour: '#E53935',
      trigram: 'SMU',
      location: '',
    });
  });

  it('falls back to the UUID and no colour for a team not in the league', () => {
    const { result } = renderHook(() => useTeamLookup(teams));

    expect(result.current('fc-gone')).toEqual({
      name: 'fc-gone',
      colour: '',
      trigram: '',
      location: '',
    });
  });

  it('keeps the same function while the Instances do not change', () => {
    const { result, rerender } = renderHook(() => useTeamLookup(teams));
    const first = result.current;

    rerender();

    expect(result.current).toBe(first);
  });

  it('gives a new function that sees the change when the Instances change', () => {
    const { result, rerender } = renderHook(({ list }) => useTeamLookup(list), {
      initialProps: { list: teams },
    });
    const first = result.current;

    rerender({ list: [instance({ name: 'Salt Marsh Renamed' })] });

    expect(result.current).not.toBe(first);
    expect(result.current(SALT_MARSH).name).toBe('Salt Marsh Renamed');
  });

  it('gives the Location of the Blueprint, also after an edit (US-09.3, Task 157)', () => {
    useDatabaseStore.setState({
      blueprints: [blueprint({ uuid: HARBORVIEW, location: 'Coastal City' })],
    });
    const { result } = renderHook(() => useTeamLookup(teams));
    expect(result.current(HARBORVIEW).location).toBe('Coastal City');
    expect(result.current(SALT_MARSH).location).toBe('');

    act(() =>
      useDatabaseStore.setState({
        blueprints: [blueprint({ uuid: HARBORVIEW, location: 'Bay Town' })],
      })
    );
    expect(result.current(HARBORVIEW).location).toBe('Bay Town');
  });
});
