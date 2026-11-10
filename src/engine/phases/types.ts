import type { BracketPlanRules } from '@/engine/bracket';
import type { Bye, GroupSetting, PhaseFixture } from '@/engine/round-robin';

/** One or two meetings of each pair of teams (US-01.2): `two-way` is
 * `generateRoundRobin`, `single-duels` is `generateSingleDuels`. */
export type Legs = 'two-way' | 'single-duels';

/** The four zone colours (US-12.5), each one used once at most. */
export type ZoneColour = 'green' | 'blue' | 'yellow' | 'red';

/** The first and the last place of a zone, from 1. */
export interface ZonePlaces {
  from: number;
  to: number;
}

/** One stored zone of a plan (Task 155 choice 3). An automatic green or
 * yellow has no `places`, because the advancement gives them. An empty
 * `label` means no label: the legend then shows the places. */
export interface PlanZone {
  colour: ZoneColour;
  places?: ZonePlaces;
  label: string;
}

/** A zone of a phase, with its places (`getPhaseZones`). `automatic` is
 * true for a green or yellow zone that follows the advancement. */
export interface PhaseZone {
  colour: ZoneColour;
  from: number;
  to: number;
  label: string;
  automatic: boolean;
}

/** A problem of the zones of one plan (US-12.5). `colours` names the two
 * zones that share a place, in place order. */
export type ZoneProblem =
  | { code: 'repeated-colour'; colour: ZoneColour }
  | { code: 'label-too-long'; colour: ZoneColour }
  | { code: 'places-on-automatic'; colour: ZoneColour }
  | { code: 'missing-places'; colour: ZoneColour }
  | { code: 'bad-places'; colour: ZoneColour }
  | { code: 'shared-place'; colours: [ZoneColour, ZoneColour] };

/** A round-robin phase plan (US-01.2). `advance` is how many teams of its
 * table go to the next phase (US-01.4). The last phase has none. `zones`
 * holds the stored zones (US-12.5). With no list, the phase has only its
 * automatic zones. */
export interface RoundRobinPlan {
  format: 'round-robin';
  legs: Legs;
  advance?: { top: number };
  zones?: PlanZone[];
}

/** A Groups phase plan (US-01.2, US-02.1). `advance` is the top N of each
 * group, plus the best M of place N + 1 (US-01.4, US-01.6). The last phase
 * has none. `zones` holds the stored zones, as in `RoundRobinPlan`. */
export interface GroupsPlan {
  format: 'groups';
  legs: Legs;
  grouping: GroupSetting;
  advance?: { top: number; bestOfNext: number };
  zones?: PlanZone[];
}

/** A bracket phase plan. Only valid as the last phase (US-01.3). `rules`
 * holds its settings. A plan with no `rules` plays with the defaults
 * (`bracketRulesOf`, Task 139). The wizard sets them from Task 140. */
export interface BracketPlan {
  format: 'bracket';
  rules?: BracketPlanRules;
}

/** The settings of one phase, before it starts (Task 126 choice 2). */
export type PhasePlan = RoundRobinPlan | GroupsPlan | BracketPlan;

/** A problem of the phase order (US-01.3). `phase` counts from 1. */
export type PhaseChainProblem =
  | { code: 'no-phases' }
  | { code: 'bracket-not-last'; phase: number }
  | { code: 'missing-advancement'; phase: number }
  | { code: 'advancement-on-last'; phase: number };

/** A problem of the team counts (US-01.4, US-01.6, US-02.1). `phase` and
 * `group` count from 1. `max` is the largest value that fits. */
export type PhaseFitProblem =
  | { code: 'too-few-teams'; phase: number; teams: number }
  | { code: 'grouping-out-of-range'; phase: number }
  | { code: 'group-too-small'; phase: number; group: number; teams: number }
  | { code: 'top-out-of-range'; phase: number; top: number; max: number }
  | { code: 'best-m-out-of-range'; phase: number; bestOfNext: number; max: number }
  | { code: 'best-m-place-missing'; phase: number; place: number };

/** A bye of one group in a Groups phase (Task 175 choice 3). `group`
 * counts from 1, as in the fixture ids. */
export interface GroupBye<TeamId> extends Bye<TeamId> {
  group: number;
}

/** A phase after its start (US-07.3). A round robin or Groups phase has
 * the fixtures with their ids (Task 77), the byes, and the groups of a
 * Groups phase. A bracket has its seeds in seed order and its bye teams.
 * Its tree comes from `buildBracketTree` (Task 139 choice 1). */
export type BuiltPhase<TeamId> =
  | {
      format: 'round-robin';
      legs: Legs;
      fixtures: PhaseFixture<TeamId>[];
      byes: Bye<TeamId>[];
    }
  | {
      format: 'groups';
      legs: Legs;
      groups: TeamId[][];
      fixtures: PhaseFixture<TeamId>[];
      byes: GroupBye<TeamId>[];
    }
  | { format: 'bracket'; seeds: TeamId[]; byeTeams: TeamId[] };
