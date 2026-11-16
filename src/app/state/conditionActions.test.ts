import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createSeededRng } from '@/engine/rng';
import { playTie, type TieRules } from '@/engine/tiebreak';
import type { LeagueWrapper, ScheduledPhase, SeasonWrapper } from '@/domain';
import {
  blueprint,
  HARBORVIEW,
  INSTALLATION,
  instance,
  LEAGUE,
  leagueWrapper,
  memoryFolder,
  OTHER_LEAGUE,
  result,
  SALT_MARSH,
  scheduled,
  SEASON,
  seasonRow,
  seasonWrapper,
} from '@/test/databaseRecords';
import {
  serializeManifestRecord,
  serializeSeasonWrapper,
} from '@/app/data/databaseFile';
import { openDatabase } from './databaseActions';
import { isLeagueUnsaved, useDatabaseStore, type DatabaseState } from './databaseStore';
import {
  createLeague,
  scorinateFixture,
  setTeamCondition,
} from './leagueWrapperActions';
import { finishSeason, openSeason } from './seasonActions';
import { createSeasonLeague } from './seasonLeagueActions';
import { createPlayoff, playPlayoff } from './seasonPlayoffActions';

const OTHER_INSTALLATION = '00000000-0000-4000-8000-0000000000ff';
const state = (): DatabaseState => useDatabaseStore.getState();
const season = (): SeasonWrapper => state().seasons[SEASON];
const blueprints = [
  blueprint(),
  blueprint({ uuid: HARBORVIEW, slug: 'harborview-sc', name: 'Harborview SC' }),
];
const SEASON_LEAGUE = { seasonUuid: SEASON, leagueUuid: LEAGUE };
const SEASON_CUP = { seasonUuid: SEASON, leagueUuid: OTHER_LEAGUE };

/** Opens the database with `wrapper` open and saved, made by another
 * installation. */
async function openWithLeague(wrapper: LeagueWrapper = leagueWrapper()): Promise<void> {
  await openDatabase(
    memoryFolder({
      manifest: serializeManifestRecord({
        installationUuid: INSTALLATION,
        blueprints,
        wrappers: [],
        seasons: [],
      }),
    }).folder
  );
  const made: LeagueWrapper = {
    ...wrapper,
    content: {
      ...wrapper.content,
      createdByInstallation: OTHER_INSTALLATION,
      lastModifiedByInstallation: OTHER_INSTALLATION,
    },
  };
  useDatabaseStore.setState({
    leagues: { [wrapper.uuid]: made },
    savedLeagues: { [wrapper.uuid]: made },
  });
}

/** Opens the test Season with two leagues of the same two teams. */
async function openWithSeason(): Promise<void> {
  const saved = seasonWrapper();
  const [league] = saved.content.leagues;
  saved.content.leagues.push({ ...league, uuid: OTHER_LEAGUE, name: 'Taça Norte' });
  await openDatabase(
    memoryFolder({
      manifest: serializeManifestRecord({
        installationUuid: INSTALLATION,
        blueprints,
        wrappers: [],
        seasons: [{ ...seasonRow(), leagueCount: 2 }],
      }),
      wrappers: { [SEASON]: serializeSeasonWrapper(saved) },
    }).folder
  );
  await openSeason(SEASON);
}

const leagueOf = (uuid: string = LEAGUE): LeagueWrapper => state().leagues[uuid];

beforeEach(() => {
  useDatabaseStore.setState(useDatabaseStore.getInitialState(), true);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('setTeamCondition (Task 226, US-14.2)', () => {
  it('sets the level of a team, stamps the league, and makes it unsaved', async () => {
    await openWithLeague();
    setTeamCondition(LEAGUE, SALT_MARSH, 2);
    expect(leagueOf().content.conditions).toEqual({ [SALT_MARSH]: 2 });
    expect(leagueOf().content.lastModifiedByInstallation).toBe(INSTALLATION);
    expect(isLeagueUnsaved(state(), LEAGUE)).toBe(true);
  });

  it('keeps the levels of the other teams', async () => {
    await openWithLeague();
    setTeamCondition(LEAGUE, SALT_MARSH, 2);
    setTeamCondition(LEAGUE, HARBORVIEW, -1);
    expect(leagueOf().content.conditions).toEqual({
      [SALT_MARSH]: 2,
      [HARBORVIEW]: -1,
    });
  });

  it('removes the entry for level 0, and the map with its last entry', async () => {
    await openWithLeague();
    setTeamCondition(LEAGUE, SALT_MARSH, 2);
    setTeamCondition(LEAGUE, HARBORVIEW, 1);
    setTeamCondition(LEAGUE, SALT_MARSH, 0);
    expect(leagueOf().content.conditions).toEqual({ [HARBORVIEW]: 1 });
    setTeamCondition(LEAGUE, HARBORVIEW, 0);
    expect('conditions' in leagueOf().content).toBe(false);
  });

  it('changes nothing for the same level', async () => {
    await openWithLeague();
    const before = leagueOf();
    setTeamCondition(LEAGUE, SALT_MARSH, 0);
    expect(leagueOf()).toBe(before);
    setTeamCondition(LEAGUE, SALT_MARSH, 1);
    const changed = leagueOf();
    setTeamCondition(LEAGUE, SALT_MARSH, 1);
    expect(leagueOf()).toBe(changed);
  });

  it('can change the level while the league runs', async () => {
    await openWithLeague(
      leagueWrapper([result('p1.g1.md1.m1', SALT_MARSH, HARBORVIEW)])
    );
    setTeamCondition(LEAGUE, HARBORVIEW, -2);
    expect(leagueOf().content.conditions).toEqual({ [HARBORVIEW]: -2 });
  });

  it('throws, and changes nothing, after the league ends', async () => {
    await openWithLeague(
      leagueWrapper([
        result('p1.g1.md1.m1', SALT_MARSH, HARBORVIEW),
        result('p1.g1.md2.m1', HARBORVIEW, SALT_MARSH),
      ])
    );
    const before = leagueOf();
    expect(() => setTeamCondition(LEAGUE, SALT_MARSH, 1)).toThrow(
      'The league "Coastal Premier" is complete. Its conditions cannot change.'
    );
    expect(leagueOf()).toBe(before);
  });

  it('throws for a team that is not in the league, and for a bad level', async () => {
    await openWithLeague();
    expect(() => setTeamCondition(LEAGUE, OTHER_LEAGUE, 1)).toThrow(
      `The league has no team with the UUID ${OTHER_LEAGUE}.`
    );
    expect(() => setTeamCondition(LEAGUE, SALT_MARSH, 3 as never)).toThrow(
      'The condition level must be -2 to 2. It got 3.'
    );
  });

  it('throws for a league that is not open', async () => {
    await openWithLeague();
    expect(() => setTeamCondition(OTHER_LEAGUE, SALT_MARSH, 1)).toThrow(
      `No open league has the UUID ${OTHER_LEAGUE}.`
    );
  });

  it('gives one Season team its own level in each league of the Season', async () => {
    await openWithSeason();
    setTeamCondition(SEASON_LEAGUE, SALT_MARSH, 2);
    setTeamCondition(SEASON_CUP, SALT_MARSH, -2);
    const [league, cup] = season().content.leagues;
    expect(league.conditions).toEqual({ [SALT_MARSH]: 2 });
    expect(cup.conditions).toEqual({ [SALT_MARSH]: -2 });
    expect(season().content.lastModifiedByInstallation).toBe(INSTALLATION);
  });

  it('throws in a finished Season (US-13.9)', async () => {
    await openWithSeason();
    finishSeason(SEASON);
    expect(() => setTeamCondition(SEASON_LEAGUE, SALT_MARSH, 1)).toThrow(RangeError);
    expect(season().content.leagues[0].conditions).toBeUndefined();
  });
});

describe('a match with the real OVR (Task 226, US-14.2)', () => {
  const firstResult = (): unknown =>
    scheduled(leagueOf().content.phases[0] as ScheduledPhase).results[0];

  it('plays a fixture with the real OVR of each team', async () => {
    // A fixed random value: the same OVRs give the same score.
    vi.spyOn(Math, 'random').mockReturnValue(0.3);
    await openWithLeague();
    setTeamCondition(LEAGUE, SALT_MARSH, 2);
    setTeamCondition(LEAGUE, HARBORVIEW, -2);
    scorinateFixture(LEAGUE, 'p1.g1.md1.m1');
    const withLevels = firstResult();

    // The same league, with the real OVRs stored as the OVRs: 89 and 50.
    const base = leagueWrapper();
    await openWithLeague({
      ...base,
      teams: [instance({ ovr: 89 }), { ...base.teams[1], ovr: 50 }],
    });
    scorinateFixture(LEAGUE, 'p1.g1.md1.m1');
    expect(withLevels).toEqual(firstResult());

    // The stored OVRs give another score with this random value, so the
    // levels did count.
    await openWithLeague();
    scorinateFixture(LEAGUE, 'p1.g1.md1.m1');
    expect(firstResult()).not.toEqual(withLevels);
  });
});

describe('the levels at create (Task 226, US-14.2, US-14.3)', () => {
  const teams = leagueWrapper().teams;
  const input = {
    name: 'Coastal Premier',
    homeAdvantage: true,
    points: { win: 3, draw: 1, loss: 0 },
    teams,
  };

  it('stores the levels of the wizard in a new league, with no level 0', async () => {
    await openWithLeague();
    const wrapper = createLeague({
      ...input,
      conditions: { [SALT_MARSH]: 1, [HARBORVIEW]: 0 },
    });
    expect(wrapper.content.conditions).toEqual({ [SALT_MARSH]: 1 });
  });

  it('stores no map for a league with all levels at 0', async () => {
    await openWithLeague();
    const wrapper = createLeague({ ...input, conditions: { [SALT_MARSH]: 0 } });
    expect('conditions' in wrapper.content).toBe(false);
  });

  it('throws for a level of a team that is not in the team list, or a bad level', async () => {
    await openWithLeague();
    expect(() => createLeague({ ...input, conditions: { [OTHER_LEAGUE]: 1 } })).toThrow(
      `The team list has no team with the UUID ${OTHER_LEAGUE}.`
    );
    expect(() =>
      createLeague({ ...input, conditions: { [SALT_MARSH]: 5 as never } })
    ).toThrow('The condition level must be -2 to 2. It got 5.');
  });

  it('stores the levels of a new Season league', async () => {
    await openWithSeason();
    const wrapper = createSeasonLeague(SEASON, {
      ...input,
      name: 'Segunda Divisão',
      conditions: { [HARBORVIEW]: -1 },
    });
    expect(wrapper.content.conditions).toEqual({ [HARBORVIEW]: -1 });
    expect(season().content.leagues[2].conditions).toEqual({ [HARBORVIEW]: -1 });
  });

  const rules: TieRules = {
    format: 'single-match',
    awayGoals: false,
    playsAet: true,
    method: 'penalties',
    homeAdvantage: true,
  };
  const playoff = {
    name: 'Supertaça',
    team1Uuid: SALT_MARSH,
    team2Uuid: HARBORVIEW,
    rules,
  };

  it('stores the levels of the playoff dialog, with no level 0', async () => {
    await openWithSeason();
    const made = createPlayoff(SEASON, {
      ...playoff,
      conditions: { [SALT_MARSH]: 0, [HARBORVIEW]: 2 },
    });
    expect(made.conditions).toEqual({ [HARBORVIEW]: 2 });
    expect(season().content.playoffs[0].conditions).toEqual({ [HARBORVIEW]: 2 });
  });

  it('throws for a playoff level of a team that is not in the playoff', async () => {
    await openWithSeason();
    expect(() =>
      createPlayoff(SEASON, { ...playoff, conditions: { [OTHER_LEAGUE]: 1 } })
    ).toThrow(`The playoff has no team with the UUID ${OTHER_LEAGUE}.`);
    expect(season().content.playoffs).toEqual([]);
  });

  it('plays a playoff with the real OVR of its own levels (US-14.3)', async () => {
    await openWithSeason();
    const { uuid } = createPlayoff(SEASON, {
      ...playoff,
      conditions: { [SALT_MARSH]: -1, [HARBORVIEW]: 1 },
    });
    playPlayoff(SEASON, uuid, createSeededRng(11));
    // 74 at -1 is 66.6, rounded down. 63 at +1 is 69.3, rounded up.
    const expected = playTie(
      { id: SALT_MARSH, ovr: 66 },
      { id: HARBORVIEW, ovr: 70 },
      rules,
      createSeededRng(11)
    );
    expect(season().content.playoffs[0].result).toEqual(expected);
  });
});
