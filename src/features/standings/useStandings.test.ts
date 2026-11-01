import { describe, expect, it } from 'vitest';
import { renderHook } from '@testing-library/preact';
import { fixedLot } from '@/engine/identity';
import { HARBORVIEW, LEAGUE, leagueWrapper, SALT_MARSH } from '@/test/databaseRecords';
import { useStandings } from './useStandings';

describe('useStandings (Task 128)', () => {
  it('orders level teams by the fixed lots of the league', () => {
    const { result } = renderHook(() => useStandings(leagueWrapper()));
    const lotOrder = [SALT_MARSH, HARBORVIEW].sort(
      (a, b) => fixedLot(LEAGUE, a) - fixedLot(LEAGUE, b)
    );
    expect(result.current.rows.map((row) => row.team)).toEqual(lotOrder);
  });

  it('shows every league team in a phase-1 round robin, also a team with no fixture yet', () => {
    const base = leagueWrapper();
    const NORTH = '00000000-0000-4000-8000-0000000000a3';
    const league = {
      ...base,
      teams: [...base.teams, { ...base.teams[0], blueprintUuid: NORTH, name: 'North' }],
    };
    const { result } = renderHook(() => useStandings(league));
    expect(result.current.rows.map((row) => row.team).sort()).toEqual(
      [SALT_MARSH, HARBORVIEW, NORTH].sort()
    );
  });
});
