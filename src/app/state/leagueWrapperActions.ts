import { uuidV4, type RandomBytes } from '@/engine/identity';
import {
  buildPhase,
  checkPhaseChain,
  checkPhaseFit,
  pickQualifiers,
  type BuiltPhase,
  type PhasePlan,
} from '@/engine/phases';
import { createSeededRng } from '@/engine/rng';
import { findPhaseResult, moveToGroup, type PhaseFixture } from '@/engine/round-robin';
import { playMatch } from '@/engine/scorination';
import type { PointsConfig } from '@/engine/standings';
import type { LeagueWrapper, Phase, PhaseResult, TeamInstance } from '@/domain';
import { cryptoRandomBytes, freshSeed } from '@/app/random';
import { findCurrentPhase } from './currentPhase';
import {
  canChangeCurrentGroups,
  canStartNextPhase,
  leagueLotOf,
  phaseStandings,
} from './phases';
import { pickTeamTrigrams } from './teamInstances';
import { requireOpenDatabase, useDatabaseStore } from './databaseStore';

/** What it takes to create a league (US-08.8). `teams` is the team list of
 * the wizard: each Instance got its OVR when it was added (Task 81). */
export interface CreateLeagueInput {
  name: string;
  homeAdvantage: boolean;
  points: PointsConfig;
  teams: readonly TeamInstance[];
  /** The trigrams fixed in the Edit drawer, by Blueprint UUID (US-09.6). */
  fixedTrigrams?: Readonly<Record<string, string>>;
  /** The phase chain of the wizard (Task 128). Without it, one two-way round
   * robin: an MVP1-style league. */
  plans?: readonly PhasePlan[];
  /** The phase-1 draw of a Groups plan, as Blueprint UUIDs (US-02.1). Each
   * team of `teams` is in one group. Without it, a Groups phase 1 draws. */
  groups?: readonly (readonly string[])[];
}

const DEFAULT_PLANS: readonly PhasePlan[] = [
  { format: 'round-robin', legs: 'two-way' },
];

/** A built phase of the engine, as a domain phase with no results yet. */
function startedPhase(built: BuiltPhase<string>): Phase {
  return { ...built, results: [] };
}

/** Throws a `RangeError` for a chain or fit problem of the plans (Task 128
 * choice 2). The wizard shows the problems before the create (Task 129), so
 * this is a guard, and the message names the problem codes. */
function checkPlans(
  plans: readonly PhasePlan[],
  teamCount: number,
  groups: readonly (readonly string[])[] | undefined
): void {
  const problems = [
    ...checkPhaseChain(plans),
    ...checkPhaseFit(
      plans,
      teamCount,
      groups?.map((group) => group.length)
    ),
  ];
  if (problems.length > 0) {
    throw new RangeError(
      `The phases of the league do not fit: ${problems.map((problem) => problem.code).join(', ')}.`
    );
  }
}

/** Throws a `RangeError` unless each team is in exactly one group. */
function checkDraw(
  groups: readonly (readonly string[])[],
  uuids: readonly string[]
): void {
  const drawn = groups.flat();
  const sameTeams =
    drawn.length === uuids.length &&
    new Set(drawn).size === drawn.length &&
    uuids.every((uuid) => drawn.includes(uuid));
  if (!sameTeams) {
    throw new RangeError('The phase-1 groups do not hold each team once.');
  }
}

/**
 * Creates a league and keeps it in the store, unsaved (Task 108). It stores
 * the Instances of the team list with their OVR (Task 81), and the trigram
 * that `pickTeamTrigrams` gives each one (Task 121). An Instance whose
 * Blueprint was deleted during the setup stays (US-09.4).
 *
 * The league stores its `plans` (Task 128), and builds phase 1 from the
 * first plan with `buildPhase`: a round robin in the team list order, or
 * Groups from `groups`. The match order is shuffled (Task 30), and the
 * fixtures have the ids of Task 77. Fixtures name teams by Blueprint UUID.
 * League names need not be unique: routes use the UUID.
 *
 * Throws a `RangeError`, and adds nothing, for a Blueprint UUID that is in
 * the list twice, for a chain or fit problem of the plans (fewer than 2
 * teams too, Task 128 choice 2), for `groups` that do not hold each team
 * once, and for a bracket phase 1 until Task 139.
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
  // The same pick as the live one of the Teams step, stored for good.
  const picks = pickTeamTrigrams(
    input.teams,
    state.blueprints,
    input.fixedTrigrams ?? {}
  );
  const teams: TeamInstance[] = input.teams.map((team) => ({
    ...team,
    trigram: picks.get(team.blueprintUuid)?.trigram ?? '',
  }));
  const uuids = teams.map((team) => team.blueprintUuid);
  const plans = input.plans ?? DEFAULT_PLANS;
  const [firstPlan] = plans;
  const groups = firstPlan?.format === 'groups' ? input.groups : undefined;
  checkPlans(plans, uuids.length, groups);
  if (groups) checkDraw(groups, uuids);
  const phaseOne = startedPhase(buildPhase(firstPlan, 1, uuids, rng, groups));

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
      plans: structuredClone([...plans]),
      phases: [phaseOne],
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

/**
 * Replaces the phase list of an open league with `change`, and stamps the
 * league with the local installation (Task 108).
 */
function replacePhases(
  leagueUuid: string,
  change: (wrapper: LeagueWrapper) => Phase[]
): void {
  const state = useDatabaseStore.getState();
  const { installationUuid } = requireOpenDatabase(state);
  const wrapper = state.leagues[leagueUuid];
  if (!wrapper) throw new RangeError(`No open league has the UUID ${leagueUuid}.`);
  const changed: LeagueWrapper = {
    ...wrapper,
    content: {
      ...wrapper.content,
      lastModifiedByInstallation: installationUuid,
      phases: change(wrapper),
    },
  };
  useDatabaseStore.setState((now) => ({
    leagues: { ...now.leagues, [leagueUuid]: changed },
  }));
}

/**
 * Starts the next phase of a league (US-07.3): picks the qualifiers of the
 * complete current phase in seed order (`pickQualifiers`, with the fixed
 * lots), builds the next phase from its plan (`buildPhase`), and adds it.
 * The earlier phases do not change, and the scorinate actions play the new
 * phase only, so the earlier phases are locked.
 *
 * Throws a `RangeError` when `canStartNextPhase` is false (Task 128 choice
 * 4), and for a bracket next phase until Task 139.
 */
export function startNextPhase(leagueUuid: string): void {
  replacePhases(leagueUuid, (wrapper) => {
    if (!canStartNextPhase(wrapper)) {
      throw new RangeError('The league cannot start its next phase now.');
    }
    const { phases, plans } = wrapper.content;
    const index = phases.length - 1;
    const qualifiers = pickQualifiers(
      plans[index],
      phaseStandings(wrapper, index),
      leagueLotOf(wrapper)
    );
    const rng = createSeededRng(freshSeed());
    return [
      ...phases,
      startedPhase(buildPhase(plans[index + 1], index + 2, qualifiers, rng)),
    ];
  });
}

/**
 * Builds the current Groups phase again from a new draw (Task 128 choice
 * 5). Only for a Groups phase after phase 1, while it has no result
 * (`canChangeCurrentGroups`, US-02.1): phase 1 draws in the wizard. Throws a
 * `RangeError` otherwise.
 */
function redrawCurrentGroups(
  leagueUuid: string,
  newGroups: (groups: readonly (readonly string[])[]) => string[][] | undefined
): void {
  replacePhases(leagueUuid, (wrapper) => {
    const { phases, plans } = wrapper.content;
    const index = phases.length - 1;
    const current = phases[index];
    if (!canChangeCurrentGroups(wrapper) || current?.format !== 'groups') {
      throw new RangeError(
        'Only a later Groups phase with no result can change its draw.'
      );
    }
    const groups = newGroups(current.groups);
    // A group of 1 has no schedule. The screen keeps such a move off.
    if (groups?.some((group) => group.length < 2)) {
      throw new RangeError('A group needs at least 2 teams.');
    }
    const rng = createSeededRng(freshSeed());
    const rebuilt = buildPhase(
      plans[index],
      index + 1,
      current.groups.flat(),
      rng,
      groups
    );
    return phases.map((phase, i) => (i === index ? startedPhase(rebuilt) : phase));
  });
}

/** "Shuffle groups" for a later Groups phase (US-02.1): a new draw of its
 * teams, and new fixtures. */
export function shuffleCurrentGroups(leagueUuid: string): void {
  redrawCurrentGroups(leagueUuid, () => undefined);
}

/** "Move to group" for a later Groups phase (US-02.5): `moveToGroup`, and
 * new fixtures. Throws the `moveToGroup` `RangeError` for an unknown team or
 * group, and a `RangeError` for a move that leaves a group with fewer than
 * 2 teams: that group has no schedule. */
export function moveTeamInCurrentGroups(
  leagueUuid: string,
  team: string,
  groupIndex: number
): void {
  redrawCurrentGroups(leagueUuid, (groups) => moveToGroup(groups, team, groupIndex));
}
