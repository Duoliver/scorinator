import type { LeagueDraftDetails } from '@/app/state/leagueDraftStore';

/** `LeagueSetupScreen` reads the current field values through this handle,
 * at a step change and at unmount, instead of on every keystroke — see
 * `leagueDraftStore.ts` for why. Each field stays fully uncontrolled below;
 * `getValues()` is the only way out. */
export interface DetailsStepHandle {
  getValues: () => LeagueDraftDetails;
}

export default interface DetailsStepProps {
  initial: LeagueDraftDetails;
  /** Slugs of the leagues already open. A name that gives one of them is
   * refused, like an invalid name (Task 40). */
  takenSlugs?: readonly string[];
  onNext: () => void;
}
