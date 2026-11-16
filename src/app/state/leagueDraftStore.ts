import { create } from 'zustand';
import { type PhasePlan, Legs, PhaseFormat } from '@/engine/phases';
import { DEFAULT_POINTS_CONFIG, type PointsConfig } from '@/engine/standings';
import type { ConditionLevels, TeamInstance } from '@/domain';

/** The four steps of the League Setup wizard, by their `Tabs` id (US-01.1). */
export type LeagueSetupStep = 'details' | 'phases' | 'teams' | 'review';

export interface LeagueDraftDetails {
  name: string;
  points: PointsConfig;
  homeAdvantage: boolean;
}

export interface LeagueDraft {
  details: LeagueDraftDetails;
  /** The team list of the Teams step: each Instance has the OVR that it
   * rolled when it was added (Task 81, Task 120). */
  teams: TeamInstance[];
  /** The trigrams fixed in the Edit drawer, by Blueprint UUID (US-09.6,
   * Task 121 choice 2). A team with no entry takes the live pick. */
  fixedTrigrams: Record<string, string>;
  /** The condition levels of the Teams step, by Blueprint UUID, with no
   * level 0 (US-14.2, Task 229 choice 2). */
  conditions: ConditionLevels;
  /** The phase chain of the Phases step (Task 129). */
  plans: PhasePlan[];
  /** The phase-1 draw as Blueprint UUIDs, when phase 1 is Groups, or
   * `null` (Task 130). */
  groups: string[][] | null;
  step: LeagueSetupStep;
}

export function emptyLeagueDraft(): LeagueDraft {
  return {
    details: { name: '', points: DEFAULT_POINTS_CONFIG, homeAdvantage: false },
    teams: [],
    fixedTrigrams: {},
    conditions: {},
    plans: [{ format: PhaseFormat.ROUND_ROBIN, legs: Legs.TWO_WAY }],
    groups: null,
    step: 'details',
  };
}

/** The League Setup wizard's in-progress, not-yet-created state. Kept apart
 * from the leagues of `databaseStore` on purpose — this is a draft, not a
 * `LeagueWrapper`. Exists so `LeagueSetupScreen` can unmount and
 * remount, as `preact-router` does on every nav switch, without losing what
 * the user was in the middle of entering.
 *
 * This store is a cold cache, not a live state manager: `LeagueSetupScreen`
 * reads it once per mount, through `getState()`, and writes to it a handful
 * of times per session, through `setLeagueDraft()` — on a step change and on
 * unmount, never per keystroke. The screen's own fields stay local and
 * uncontrolled between those points; see `DetailsStep`'s `getValues()`
 * handle. `resetLeagueDraft()` runs after a successful create. Both actions
 * live in `leagueDraftActions.ts`. */
export interface LeagueDraftState extends LeagueDraft {
  /** The draft of a new league in each Season, by Season UUID. The top
   * level draft is the standalone one. A Season wizard never clears it
   * (Task 218 choice 3). */
  seasonDrafts: Record<string, LeagueDraft>;
}

export const useLeagueDraftStore = create<LeagueDraftState>()(() => ({
  ...emptyLeagueDraft(),
  seasonDrafts: {},
}));

/** The draft of the standalone wizard, or of the wizard in one Season. A
 * Season with no draft gives an empty one. */
export function getLeagueDraft(
  state: LeagueDraftState,
  seasonUuid?: string
): LeagueDraft {
  if (seasonUuid === undefined) {
    const { seasonDrafts: _seasons, ...draft } = state;
    return draft;
  }
  return state.seasonDrafts[seasonUuid] ?? emptyLeagueDraft();
}
