import { uuidV4, type RandomBytes } from '@/engine/identity';
import { createSeededRng } from '@/engine/rng';
import {
  assignFixtureIds,
  findPhaseResult,
  generateRoundRobin,
  type PhaseFixture,
} from '@/engine/round-robin';
import { playMatch } from '@/engine/scorination';
import type { PointsConfig } from '@/engine/standings';
import type { LeagueWrapper, Phase, PhaseResult, TeamInstance } from '@/domain';
import { cryptoRandomBytes, freshSeed } from '@/app/random';
import { findCurrentPhase } from './currentPhase';
import { requireOpenDatabase, useDatabaseStore } from './databaseStore';

/** What it takes to create a league (US-08.8). `teams` is the team list of
 * the wizard: each Instance got its OVR when it was added (Task 81). */
export interface CreateLeagueInput {
  name: string;
  homeAdvantage: boolean;
  points: PointsConfig;
  teams: readonly TeamInstance[];
}

/**
 * Creates a league and keeps it in the store, unsaved (Task 108). It stores
 * the Instances of the team list as they are, with their OVR (Task 81): an
 * Instance whose Blueprint was deleted during the setup stays (US-09.4).
 * Phase 1 is a two-way round robin with the shuffled match order (Task 30)
 * and the fixture ids of Task 105. Fixtures name teams by Blueprint UUID. A
 * league with fewer than 2 teams gets an empty phase 1, as in MVP1: Task 121
 * disables "Create league" for that case. League names need not be unique:
 * routes use the UUID. Throws a `RangeError` for a Blueprint UUID that is in
 * the list twice, and adds nothing.
 */
export function createLeague(
  input: CreateLeagueInput,
  randomBytes: RandomBytes = cryptoRandomBytes
): LeagueWrapper {
  const state = useDatabaseStore.getState();
  const { installationUuid } = requireOpenDatabase(state);
  const seen = new Set<string>();
  for (const team of input.teams) {
    if (seen.has(team.blueprintUuid)) {
      throw new RangeError(
        `The team list has the Blueprint UUID ${team.blueprintUuid} twice.`
      );
    }
    seen.add(team.blueprintUuid);
  }

  const rng = createSeededRng(freshSeed());
  const teams: TeamInstance[] = input.teams.map((team) => ({ ...team }));
  const uuids = teams.map((team) => team.blueprintUuid);
  const schedule =
    uuids.length >= 2 ? generateRoundRobin(uuids, rng) : { fixtures: [], byes: [] };

  const uuid = uuidV4(randomBytes);
  const wrapper: LeagueWrapper = {
    uuid,
    teams,
    content: {
      uuid,
      name: input.name,
      homeAdvantage: input.homeAdvantage,
      points: input.points,
      createdByInstallation: installationUuid,
      lastModifiedByInstallation: installationUuid,
      phases: [
        {
          format: 'round-robin',
          fixtures: assignFixtureIds(schedule.fixtures, { phase: 1, group: 1 }),
          byes: schedule.byes,
          results: [],
        },
      ],
    },
  };
  useDatabaseStore.setState((now) => ({
    leagues: { ...now.leagues, [uuid]: wrapper },
  }));
  return wrapper;
}

/** Plays one fixture with a fresh seed, by the MVP1 rules: the stored OVR
 * and the league home advantage flag. */
function playFixture(
  wrapper: LeagueWrapper,
  fixture: PhaseFixture<string>
): PhaseResult {
  const ovrOf = (uuid: string): number => {
    const team = wrapper.teams.find((candidate) => candidate.blueprintUuid === uuid);
    if (!team) throw new RangeError(`The league has no team with the UUID ${uuid}.`);
    return team.ovr;
  };
  const score = playMatch(
    ovrOf(fixture.home),
    ovrOf(fixture.away),
    wrapper.content.homeAdvantage,
    createSeededRng(freshSeed())
  );
  return { fixtureId: fixture.id, home: fixture.home, away: fixture.away, ...score };
}

/**
 * Changes the current phase of an open league (`findCurrentPhase`). The
 * `change` returns the same phase for "no change", and then nothing happens.
 * A real change stamps the league with the local installation (Task 108).
 */
function changeCurrentPhase(
  leagueUuid: string,
  change: (phase: Phase, wrapper: LeagueWrapper) => Phase
): void {
  const state = useDatabaseStore.getState();
  const { installationUuid } = requireOpenDatabase(state);
  const wrapper = state.leagues[leagueUuid];
  if (!wrapper) throw new RangeError(`No open league has the UUID ${leagueUuid}.`);

  const current = findCurrentPhase(wrapper);
  if (!current) return;
  const phase = change(current, wrapper);
  if (phase === current) return;
  const { phases } = wrapper.content;

  const changed: LeagueWrapper = {
    ...wrapper,
    content: {
      ...wrapper.content,
      lastModifiedByInstallation: installationUuid,
      phases: phases.map((candidate) => (candidate === current ? phase : candidate)),
    },
  };
  useDatabaseStore.setState((now) => ({
    leagues: { ...now.leagues, [leagueUuid]: changed },
  }));
}

function findFixture(phase: Phase, fixtureId: string): PhaseFixture<string> {
  const fixture = phase.fixtures.find((candidate) => candidate.id === fixtureId);
  if (!fixture) {
    throw new RangeError(
      `The league has no fixture "${fixtureId}" in its current phase.`
    );
  }
  return fixture;
}

/** Plays one fixture of the current phase. Skips a fixture that has a result:
 * that is `rescorinateFixture`. */
export function scorinateFixture(leagueUuid: string, fixtureId: string): void {
  changeCurrentPhase(leagueUuid, (phase, wrapper) => {
    const fixture = findFixture(phase, fixtureId);
    if (findPhaseResult(phase.results, fixture)) return phase;
    return { ...phase, results: [...phase.results, playFixture(wrapper, fixture)] };
  });
}

/** Draws a new score for a fixture that has a result, in the same place in
 * the list (MVP1 Task 7). Does nothing for a fixture with no result. */
export function rescorinateFixture(leagueUuid: string, fixtureId: string): void {
  changeCurrentPhase(leagueUuid, (phase, wrapper) => {
    const fixture = findFixture(phase, fixtureId);
    if (!findPhaseResult(phase.results, fixture)) return phase;
    const replacement = playFixture(wrapper, fixture);
    return {
      ...phase,
      results: phase.results.map((result) =>
        result.fixtureId === fixture.id ? replacement : result
      ),
    };
  });
}

/** Plays each unplayed fixture of one matchday of the current phase. */
export function scorinateMatchday(leagueUuid: string, matchday: number): void {
  changeCurrentPhase(leagueUuid, (phase, wrapper) => {
    const unplayed = phase.fixtures.filter(
      (fixture) =>
        fixture.matchday === matchday && !findPhaseResult(phase.results, fixture)
    );
    if (unplayed.length === 0) return phase;
    return {
      ...phase,
      results: [
        ...phase.results,
        ...unplayed.map((fixture) => playFixture(wrapper, fixture)),
      ],
    };
  });
}
