import type { PlanZone, ZoneColour, ZonePlan } from '@/engine/phases';

export default interface ZoneEditorProps {
  /** The plan of the phase: its advancement gives the automatic zones, and
   * its stored zones are the start values. A new start needs a new mount. */
  plan: ZonePlan;
  /** Gets the stored zones after each change (Task 189 choice 3). */
  onChange: (zones: PlanZone[]) => void;
}

/** The values of one colour row, as the fields hold them. */
export interface ZoneRowValues {
  on: boolean;
  from: string;
  to: string;
  label: string;
}

/** One colour row, ready for the markup. `places` is the text of an
 * automatic zone, for example "Places 1–2 · from the advancement". */
export interface ZoneRowView {
  colour: ZoneColour;
  name: string;
  automatic: boolean;
  places: string | undefined;
  values: ZoneRowValues;
}
