import type { RefObject } from 'preact';
import type { FieldHandle } from '@/design-system/field';
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

/** The text each field starts with, from the draft. */
export interface DetailsStepStartValues {
  name: string;
  win: string;
  draw: string;
  loss: string;
  homeAdvantage: boolean;
}

/** What `useDetailsStep` gives `DetailsStep`. */
export interface DetailsStepState {
  nameRef: RefObject<FieldHandle<string>>;
  winRef: RefObject<FieldHandle<string>>;
  drawRef: RefObject<FieldHandle<string>>;
  lossRef: RefObject<FieldHandle<string>>;
  homeAdvantageRef: RefObject<FieldHandle<boolean>>;
  startValues: DetailsStepStartValues;
  /** Why the name cannot be used, or `null`. Next stays off while it is set. */
  nameProblem: string | null;
  handleNameChange: (name: string) => void;
}
