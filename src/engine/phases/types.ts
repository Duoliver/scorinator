import type { GroupSetting } from '@/engine/round-robin';

/** One or two meetings of each pair of teams (US-01.2): `two-way` is
 * `generateRoundRobin`, `single-duels` is `generateSingleDuels`. */
export type Legs = 'two-way' | 'single-duels';

/** A round-robin phase plan (US-01.2). `advance` is how many teams of its
 * table go to the next phase (US-01.4). The last phase has none. */
export interface RoundRobinPlan {
  format: 'round-robin';
  legs: Legs;
  advance?: { top: number };
}

/** A Groups phase plan (US-01.2, US-02.1). `advance` is the top N of each
 * group, plus the best M of place N + 1 (US-01.4, US-01.6). The last phase
 * has none. */
export interface GroupsPlan {
  format: 'groups';
  legs: Legs;
  grouping: GroupSetting;
  advance?: { top: number; bestOfNext: number };
}

/** A bracket phase plan. Only valid as the last phase (US-01.3). M4 (Task
 * 140) adds its settings. */
export interface BracketPlan {
  format: 'bracket';
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
