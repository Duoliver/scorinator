import {
  buildPhase,
  checkPhaseChain,
  checkPhaseFit,
  type BuiltPhase,
  type PhasePlan,
  PhaseFormat,
  Legs,
} from '@/engine/phases';
import { createSeededRng } from '@/engine/rng';
import type { PointsConfig } from '@/engine/standings';
import type { ConditionLevels, League, Phase, TeamInstance } from '@/domain';
import { freshSeed } from '@/app/random';
import { pickConditions } from './condition';

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
  /** The condition levels of the Teams step, by Blueprint UUID (US-14.2).
   * A team with no entry starts at level 0. */
  conditions?: Readonly<ConditionLevels>;
}

const DEFAULT_PLANS: readonly PhasePlan[] = [
  { format: PhaseFormat.ROUND_ROBIN, legs: Legs.TWO_WAY },
];

/** A built phase of the engine, as a domain phase with no results yet. A
 * bracket starts with the Task 185 rule on. */
export function startedPhase(built: BuiltPhase<string>): Phase {
  if (built.format === PhaseFormat.BRACKET)
    return { ...built, results: [], avoidGroupTies: true };
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

/** Throws a `RangeError` for a Blueprint UUID that is in the team list
 * twice. */
export function checkTeamList(teams: readonly TeamInstance[]): void {
  const seen = new Set<string>();
  for (const team of teams) {
    if (seen.has(team.blueprintUuid)) {
      throw new RangeError(
        `The team list has the Blueprint UUID ${team.blueprintUuid} twice.`
      );
    }
    seen.add(team.blueprintUuid);
  }
}

/**
 * The content of a new league. One build for every new league, so a Season
 * league is a full MVP2 league (US-13.5, Task 216 choice 5). It stores its `plans` (Task 128), and builds
 * phase 1 from the first plan with `buildPhase`: a round robin in the team
 * order, or Groups from `groups`, or a bracket with a stored draw (US-04.2).
 * The match order is shuffled (Task 30), and fixtures name teams by
 * Blueprint UUID.
 *
 * Throws a `RangeError` for a chain or fit problem of the plans (fewer than
 * 2 teams too, Task 128 choice 2), for `groups` that do not hold each
 * team once, and for a condition level of a team that is not in the list
 * or a value that is not a level (Task 226).
 */
export function buildLeagueContent(
  input: Pick<
    CreateLeagueInput,
    'name' | 'homeAdvantage' | 'points' | 'plans' | 'groups' | 'conditions'
  >,
  teamUuids: readonly string[],
  uuid: string,
  installationUuid: string
): League {
  const plans = input.plans ?? DEFAULT_PLANS;
  const [firstPlan] = plans;
  const groups = firstPlan?.format === PhaseFormat.GROUPS ? input.groups : undefined;
  checkPlans(plans, teamUuids.length, groups);
  if (groups) checkDraw(groups, teamUuids);
  const conditions = pickConditions(
    input.conditions,
    new Set(teamUuids),
    'The team list'
  );
  const rng = createSeededRng(freshSeed());
  const phaseOne = startedPhase(buildPhase(firstPlan, 1, [...teamUuids], rng, groups));
  return {
    uuid,
    name: input.name,
    homeAdvantage: input.homeAdvantage,
    points: input.points,
    createdByInstallation: installationUuid,
    lastModifiedByInstallation: installationUuid,
    plans: structuredClone([...plans]),
    phases: [phaseOne],
    ...conditions,
  };
}
