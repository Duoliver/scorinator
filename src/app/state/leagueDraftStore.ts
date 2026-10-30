import { create } from 'zustand';
import { DEFAULT_POINTS_CONFIG, type PointsConfig } from '@/engine/standings';
import type { TeamInstance } from '@/domain';

/** The three steps of the League Setup wizard, by their `Tabs` id. */
export type LeagueSetupStep = 'details' | 'teams' | 'review';

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
  step: LeagueSetupStep;
}

export function emptyLeagueDraft(): LeagueDraft {
  return {
    details: { name: '', points: DEFAULT_POINTS_CONFIG, homeAdvantage: false },
    teams: [],
    fixedTrigrams: {},
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
export type LeagueDraftState = LeagueDraft;

export const useLeagueDraftStore = create<LeagueDraftState>()(() => emptyLeagueDraft());
