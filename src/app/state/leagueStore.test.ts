import { beforeEach, describe, expect, it } from 'vitest';
import { useLeagueStore } from './leagueStore';
import { TIER_OVR_RANGES } from '../../engine/tier-ovr';
import type { TeamRecord } from '../../features/components';

const team = (overrides: Partial<TeamRecord> = {}): TeamRecord => ({
  slug: 'fc-united',
  name: 'FC United',
  colour: '#E53935',
  tier: 'B',
  ...overrides,
});

beforeEach(() => {
  useLeagueStore.setState({ leagues: [] });
});

describe('useLeagueStore', () => {
  it('starts with no leagues', () => {
    expect(useLeagueStore.getState().leagues).toEqual([]);
  });

  it('addLeague appends a league carrying the given name, home advantage flag, and points config', () => {
    const league = useLeagueStore.getState().addLeague({
      name: 'Coastal Premier',
      homeAdvantage: true,
      points: { win: 3, draw: 1, loss: 0 },
      teams: [],
    });

    expect(league.name).toBe('Coastal Premier');
    expect(league.homeAdvantage).toBe(true);
    expect(league.points).toEqual({ win: 3, draw: 1, loss: 0 });
    expect(useLeagueStore.getState().leagues).toEqual([league]);
  });

  it('rolls an OVR for every selected team, inside that team Tier range', () => {
    const league = useLeagueStore.getState().addLeague({
      name: 'Coastal Premier',
      homeAdvantage: false,
      points: { win: 3, draw: 1, loss: 0 },
      teams: [
        team({ slug: 'fc-united', tier: 'S' }),
        team({ slug: 'fc-rivals', tier: 'F' }),
      ],
    });

    expect(league.teams).toEqual([
      { slug: 'fc-united', ovr: expect.any(Number) },
      { slug: 'fc-rivals', ovr: expect.any(Number) },
    ]);
    const [rolledS, rolledF] = league.teams;
    expect(rolledS.ovr).toBeGreaterThanOrEqual(TIER_OVR_RANGES.S.min);
    expect(rolledS.ovr).toBeLessThanOrEqual(TIER_OVR_RANGES.S.max);
    expect(rolledF.ovr).toBeGreaterThanOrEqual(TIER_OVR_RANGES.F.min);
    expect(rolledF.ovr).toBeLessThanOrEqual(TIER_OVR_RANGES.F.max);
  });
});
