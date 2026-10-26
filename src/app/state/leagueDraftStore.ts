import { create } from 'zustand';
import { DEFAULT_POINTS_CONFIG, type PointsConfig } from '@/engine/standings';

/** The three steps of the League Setup wizard, by their `Tabs` id. */
export type LeagueSetupStep = 'details' | 'teams' | 'review';

export interface LeagueDraftDetails {
  name: string;
  points: PointsConfig;
  homeAdvantage: boolean;
}

export interface LeagueDraft {
  details: LeagueDraftDetails;
  selectedSlugs: string[];
  step: LeagueSetupStep;
}

export function emptyLeagueDraft(): LeagueDraft {
  return {
    details: { name: '', points: DEFAULT_POINTS_CONFIG, homeAdvantage: false },
    selectedSlugs: [],
    step: 'details',
  };
}

/** The League Setup wizard's in-progress, not-yet-created state. Kept apart
 * from `leagueStore` (the committed leagues list) on purpose — this is a
 * draft, not a `LeagueRecord`. Exists so `LeagueSetupScreen` can unmount and
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
