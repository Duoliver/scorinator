import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useLeagueStore } from './leagueStore';
import { isLeagueUnsaved, useFileStore } from './fileStore';
import type { LeagueRecord } from '@/features/leagues/types';
import { TIER_OVR_RANGES } from '@/engine/tier-ovr';
import { createSeededRng } from '@/engine/rng';
import { applyHomeAdvantage, scorinateMatch } from '@/engine/scorination';
import { calculateStandings } from '@/engine/standings';
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
  useFileStore.setState({
    currentLeagueSlug: null,
    paths: {},
    savedLeagues: {},
    status: null,
  });
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

  it('shuffles the match order inside each matchday', () => {
    // Without a shuffle, the first selected team plays the first match of
    // every matchday. With 8 teams, a shuffle leaves that in all 14
    // matchdays with a chance of about 1 in 270 million.
    const slugs = ['t1', 't2', 't3', 't4', 't5', 't6', 't7', 't8'];
    const league = useLeagueStore.getState().addLeague({
      name: 'Coastal Premier',
      homeAdvantage: false,
      points: { win: 3, draw: 1, loss: 0 },
      teams: slugs.map((slug) => team({ slug })),
    });

    const firstMatchHasT1 = Array.from({ length: 14 }, (_, i) => {
      const first = league.fixtures.find((fixture) => fixture.matchday === i + 1);
      return first?.home === 't1' || first?.away === 't1';
    });
    expect(firstMatchHasT1.every(Boolean)).toBe(false);
    expect(league.fixtures).toHaveLength(56);
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

  describe('rescorinateFixture', () => {
    const setupLeague = (homeAdvantage = false): LeagueRecord =>
      useLeagueStore.getState().addLeague({
        name: 'Coastal Premier',
        homeAdvantage,
        points: { win: 3, draw: 1, loss: 0 },
        teams: [
          team({ slug: 'fc-united', tier: 'S' }),
          team({ slug: 'fc-rivals', tier: 'F' }),
          team({ slug: 'fc-town', tier: 'C' }),
        ],
      });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('replaces the result in place: same count, same position, other results untouched', () => {
      const league = setupLeague();
      const [first, second, third] = league.fixtures;
      const store = useLeagueStore.getState();
      store.scorinateFixture(league.slug, first);
      store.scorinateFixture(league.slug, second);
      store.scorinateFixture(league.slug, third);
      const before = useLeagueStore.getState().leagues[0].results;

      store.rescorinateFixture(league.slug, second);

      const after = useLeagueStore.getState().leagues[0].results;
      expect(after).toHaveLength(3);
      expect(after[0]).toEqual(before[0]);
      expect(after[2]).toEqual(before[2]);
      expect(after[1]).toMatchObject({
        matchday: second.matchday,
        home: second.home,
        away: second.away,
      });
    });

    it('draws a fresh score from the engine, with the home advantage boost when the league has it on', () => {
      const league = setupLeague(true);
      const fixture = league.fixtures[0];
      useLeagueStore.getState().scorinateFixture(league.slug, fixture);

      const random = 0.3141;
      vi.spyOn(Math, 'random').mockReturnValue(random);
      useLeagueStore.getState().rescorinateFixture(league.slug, fixture);

      const homeOvr = league.teams.find((t) => t.slug === fixture.home)!.ovr;
      const awayOvr = league.teams.find((t) => t.slug === fixture.away)!.ovr;
      const expected = scorinateMatch(
        applyHomeAdvantage(homeOvr),
        awayOvr,
        createSeededRng(Math.floor(random * 0xffffffff))
      );
      expect(useLeagueStore.getState().leagues[0].results[0]).toEqual({
        matchday: fixture.matchday,
        home: fixture.home,
        away: fixture.away,
        ...expected,
      });
    });

    it('leaves the standings with one played match per team, using the new score', () => {
      const league = setupLeague();
      const fixture = league.fixtures[0];
      useLeagueStore.getState().scorinateFixture(league.slug, fixture);
      useLeagueStore.getState().rescorinateFixture(league.slug, fixture);

      const { results, teams, points } = useLeagueStore.getState().leagues[0];
      const rows = calculateStandings(
        teams.map((t) => t.slug),
        results,
        points
      );
      const home = rows.find((row) => row.team === fixture.home)!;
      const away = rows.find((row) => row.team === fixture.away)!;
      expect(home.played).toBe(1);
      expect(away.played).toBe(1);
      expect(home.goalsFor).toBe(results[0].homeGoals);
      expect(home.goalsAgainst).toBe(results[0].awayGoals);
    });

    it('does nothing for a fixture with no result yet', () => {
      const league = setupLeague();

      useLeagueStore.getState().rescorinateFixture(league.slug, league.fixtures[0]);

      expect(useLeagueStore.getState().leagues[0].results).toEqual([]);
    });

    it('does nothing for an unknown league slug', () => {
      const league = setupLeague();
      useLeagueStore.getState().scorinateFixture(league.slug, league.fixtures[0]);
      const before = useLeagueStore.getState().leagues;

      useLeagueStore
        .getState()
        .rescorinateFixture('no-such-league', league.fixtures[0]);

      expect(useLeagueStore.getState().leagues).toEqual(before);
    });
  });

  describe('unsaved tracking', () => {
    const setup = (): LeagueRecord =>
      useLeagueStore.getState().addLeague({
        name: 'Coastal Premier',
        homeAdvantage: false,
        points: { win: 3, draw: 1, loss: 0 },
        teams: [team({ slug: 'fc-united' }), team({ slug: 'fc-rivals' })],
      });
    const unsaved = (): boolean =>
      isLeagueUnsaved(
        useLeagueStore.getState().leagues[0],
        useFileStore.getState().savedLeagues
      );
    const markSaved = (): void =>
      useFileStore.getState().markSaved(useLeagueStore.getState().leagues[0]);

    it('leaves a new league unsaved, since it was never written', () => {
      setup();
      expect(unsaved()).toBe(true);
    });

    it('leaves a saved league unsaved after a scorinate', () => {
      const league = setup();
      markSaved();
      expect(unsaved()).toBe(false);

      useLeagueStore.getState().scorinateFixture(league.slug, league.fixtures[0]);

      expect(unsaved()).toBe(true);
    });

    it('leaves a saved league unsaved after a re-scorinate', () => {
      const league = setup();
      useLeagueStore.getState().scorinateFixture(league.slug, league.fixtures[0]);
      markSaved();

      useLeagueStore.getState().rescorinateFixture(league.slug, league.fixtures[0]);

      expect(unsaved()).toBe(true);
    });

    it('keeps a saved league saved when a scorinate does nothing', () => {
      const league = setup();
      useLeagueStore.getState().scorinateFixture(league.slug, league.fixtures[0]);
      markSaved();

      useLeagueStore.getState().scorinateFixture(league.slug, league.fixtures[0]);
      useLeagueStore.getState().rescorinateFixture(league.slug, league.fixtures[1]);

      expect(unsaved()).toBe(false);
    });

    it('leaves the other leagues saved when one changes', () => {
      const first = setup();
      useLeagueStore.getState().addLeague({
        name: 'Inland Cup',
        homeAdvantage: false,
        points: { win: 3, draw: 1, loss: 0 },
        teams: [team({ slug: 'fc-united' }), team({ slug: 'fc-rivals' })],
      });
      for (const league of useLeagueStore.getState().leagues) {
        useFileStore.getState().markSaved(league);
      }

      useLeagueStore.getState().scorinateFixture(first.slug, first.fixtures[0]);

      const [changed, untouched] = useLeagueStore.getState().leagues;
      const { savedLeagues } = useFileStore.getState();
      expect(isLeagueUnsaved(changed, savedLeagues)).toBe(true);
      expect(isLeagueUnsaved(untouched, savedLeagues)).toBe(false);
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
