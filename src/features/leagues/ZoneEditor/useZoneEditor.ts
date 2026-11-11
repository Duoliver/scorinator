import { useState } from 'preact/hooks';
import { checkZones, getAutomaticZones, type ZoneColour } from '@/engine/phases';
import {
  buildZones,
  formatPlaces,
  getColourName,
  getInitialRows,
  getZoneProblemText,
  ZONE_COLOURS,
} from './helpers';
import type ZoneEditorProps from './types';
import type { ZoneRowValues, ZoneRowView } from './types';

/** The rows and the problems of the zone editor (Task 189). The rows start
 * from the plan once. Each change gives the stored zones to `onChange`. */
export function useZoneEditor({ plan, onChange }: ZoneEditorProps): {
  rows: ZoneRowView[];
  problems: string[];
  changeRow: (colour: ZoneColour, change: Partial<ZoneRowValues>) => void;
} {
  const [values, setValues] = useState(() => getInitialRows(plan));
  const automatic = getAutomaticZones(plan);
  const zones = buildZones(plan, values);

  const changeRow = (colour: ZoneColour, change: Partial<ZoneRowValues>): void => {
    const next = { ...values, [colour]: { ...values[colour], ...change } };
    setValues(next);
    onChange(buildZones(plan, next));
  };

  return {
    rows: ZONE_COLOURS.map((colour) => {
      const auto = automatic.find((zone) => zone.colour === colour);
      return {
        colour,
        name: getColourName(colour),
        automatic: auto !== undefined,
        places: auto && `${formatPlaces(auto.from, auto.to)} · from the advancement`,
        values: values[colour],
      };
    }),
    problems: checkZones({ ...plan, zones }).map(getZoneProblemText),
    changeRow,
  };
}
