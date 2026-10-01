import { beforeEach, describe, expect, it } from 'vitest';
import { useLeagueStore } from './leagueStore';
import { useFileStore } from './fileStore';
import type { LeagueRecord } from '@/features/leagues/types';
import { TIER_OVR_RANGES } from '@/engine/tier-ovr';
import type { TeamRecord } from '@/features/components';

const team = (overrides: Partial<TeamRecord> = {}): TeamRecord => ({
  slug: 'fc-united',
  name: 'FC United',
  colour: '#E53935',
  tier: 'B',
  ...overrides,
});

const record = (overrides: Partial<LeagueRecord> = {}): LeagueRecord => ({
  slug: 'coastal-premier',
  name: 'Coastal Premier',
  homeAdvantage: false,
  points: { win: 3, draw: 1, loss: 0 },
  teams: [],
  fixtures: [],
  byes: [],
  results: [],
  ...overrides,
});

beforeEach(() => {
  useLeagueStore.setState({ leagues: [] });
  useFileStore.setState({ currentLeagueSlug: null, paths: {}, status: null });
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

  it('addLeague rolls a slug from the given name', () => {
    const league = useLeagueStore.getState().addLeague({
      name: 'Coastal Premier',
      homeAdvantage: true,
      points: { win: 3, draw: 1, loss: 0 },
      teams: [],
    });

    expect(league.slug).toBe('coastal-premier');
  });

  it('addLeague throws for a degenerate name, same as team slug()', () => {
    expect(() =>
      useLeagueStore.getState().addLeague({
        name: '!!!',
        homeAdvantage: false,
        points: { win: 3, draw: 1, loss: 0 },
        teams: [],
      })
    ).toThrow(RangeError);
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

  it('generates a two-way round-robin schedule from the selected teams, for 2 or more teams', () => {
    const league = useLeagueStore.getState().addLeague({
      name: 'Coastal Premier',
      homeAdvantage: false,
      points: { win: 3, draw: 1, loss: 0 },
      teams: [team({ slug: 'fc-united' }), team({ slug: 'fc-rivals' })],
    });

    expect(league.byes).toEqual([]);
    expect(league.fixtures).toEqual([
      { matchday: 1, home: 'fc-united', away: 'fc-rivals' },
      { matchday: 2, home: 'fc-rivals', away: 'fc-united' },
    ]);
  });

  it('stores an empty schedule for fewer than 2 teams, rather than throwing', () => {
    const oneTeam = useLeagueStore.getState().addLeague({
      name: 'Solo League',
      homeAdvantage: false,
      points: { win: 3, draw: 1, loss: 0 },
      teams: [team({ slug: 'fc-united' })],
    });
    const noTeams = useLeagueStore.getState().addLeague({
      name: 'Empty League',
      homeAdvantage: false,
      points: { win: 3, draw: 1, loss: 0 },
      teams: [],
    });

    expect(oneTeam.fixtures).toEqual([]);
    expect(oneTeam.byes).toEqual([]);
    expect(noTeams.fixtures).toEqual([]);
    expect(noTeams.byes).toEqual([]);
  });

  it('addLeague makes the new league the current one for saving', () => {
    useLeagueStore.getState().addLeague({
      name: 'Coastal Premier',
      homeAdvantage: true,
      points: { win: 3, draw: 1, loss: 0 },
      teams: [],
    });

    expect(useFileStore.getState().currentLeagueSlug).toBe('coastal-premier');
  });

  describe('loadLeague', () => {
    it('appends a league with a new slug', () => {
      const existing = record({ slug: 'inland-cup', name: 'Inland Cup' });
      useLeagueStore.setState({ leagues: [existing] });

      const loaded = record();
      useLeagueStore.getState().loadLeague(loaded);

      expect(useLeagueStore.getState().leagues).toEqual([existing, loaded]);
    });

    it('replaces the league with the same slug in place, keeping the list order', () => {
      const first = record({ slug: 'inland-cup', name: 'Inland Cup' });
      const old = record();
      const last = record({ slug: 'north-shield', name: 'North Shield' });
      useLeagueStore.setState({ leagues: [first, old, last] });

      const loaded = record({ homeAdvantage: true });
      useLeagueStore.getState().loadLeague(loaded);

      expect(useLeagueStore.getState().leagues).toEqual([first, loaded, last]);
    });
  });

  describe('scorinateFixture', () => {
    it('appends a result for the given fixture, with plausible goal counts', () => {
      const league = useLeagueStore.getState().addLeague({
        name: 'Coastal Premier',
        homeAdvantage: false,
        points: { win: 3, draw: 1, loss: 0 },
        teams: [team({ slug: 'fc-united' }), team({ slug: 'fc-rivals' })],
      });

      useLeagueStore.getState().scorinateFixture(league.slug, league.fixtures[0]);

      const [updated] = useLeagueStore.getState().leagues;
      expect(updated.results).toEqual([
        {
          matchday: 1,
          home: 'fc-united',
          away: 'fc-rivals',
          homeGoals: expect.any(Number),
          awayGoals: expect.any(Number),
        },
      ]);
      expect(updated.results[0].homeGoals).toBeGreaterThanOrEqual(0);
      expect(updated.results[0].awayGoals).toBeGreaterThanOrEqual(0);
    });

    it('does nothing for a fixture that already has a result', () => {
      const league = useLeagueStore.getState().addLeague({
        name: 'Coastal Premier',
        homeAdvantage: false,
        points: { win: 3, draw: 1, loss: 0 },
        teams: [team({ slug: 'fc-united' }), team({ slug: 'fc-rivals' })],
      });
      const fixture = league.fixtures[0];

      useLeagueStore.getState().scorinateFixture(league.slug, fixture);
      const firstResult = useLeagueStore.getState().leagues[0].results[0];
      useLeagueStore.getState().scorinateFixture(league.slug, fixture);

      const { results } = useLeagueStore.getState().leagues[0];
      expect(results).toHaveLength(1);
      expect(results[0]).toEqual(firstResult);
    });
  });

  describe('scorinateMatchday', () => {
    it('scorinates every unplayed fixture on the given matchday, and none from another matchday', () => {
      const league = useLeagueStore.getState().addLeague({
        name: 'Coastal Premier',
        homeAdvantage: false,
        points: { win: 3, draw: 1, loss: 0 },
        teams: [
          team({ slug: 'fc-united' }),
          team({ slug: 'fc-rivals' }),
          team({ slug: 'fc-town' }),
          team({ slug: 'fc-rangers' }),
        ],
      });

      useLeagueStore.getState().scorinateMatchday(league.slug, 1);

      const { results, fixtures } = useLeagueStore.getState().leagues[0];
      const matchdayOne = fixtures.filter((fixture) => fixture.matchday === 1);
      expect(results).toHaveLength(matchdayOne.length);
      expect(results.every((result) => result.matchday === 1)).toBe(true);
    });

    it('skips a fixture that already has a result', () => {
      const league = useLeagueStore.getState().addLeague({
        name: 'Coastal Premier',
        homeAdvantage: false,
        points: { win: 3, draw: 1, loss: 0 },
        teams: [team({ slug: 'fc-united' }), team({ slug: 'fc-rivals' })],
      });
      useLeagueStore.getState().scorinateFixture(league.slug, league.fixtures[0]);
      const firstResult = useLeagueStore.getState().leagues[0].results[0];

      useLeagueStore.getState().scorinateMatchday(league.slug, 1);

      const { results } = useLeagueStore.getState().leagues[0];
      expect(results).toHaveLength(1);
      expect(results[0]).toEqual(firstResult);
    });
  });
});
