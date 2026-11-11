import {
  getAutomaticZones,
  ZONE_LABEL_MAX,
  type PlanZone,
  ZoneColour,
  type ZonePlan,
  type ZoneProblem,
} from '@/engine/phases';
import type { ZoneRowValues } from './types';

/** The four rows of the editor, in this order (Task 189 choice 2). */
export const ZONE_COLOURS: readonly ZoneColour[] = Object.values(ZoneColour);

/** The row name of a colour: "Green". */
export const getColourName = (colour: ZoneColour): string =>
  colour.charAt(0).toUpperCase() + colour.slice(1);

/** "Place 3" or "Places 1–2". */
export const formatPlaces = (from: number, to: number): string =>
  from === to ? `Place ${from}` : `Places ${from}–${to}`;

/** A place field value: a whole number, or `NaN` for any other text, so
 * `checkZones` reports it. */
export function parsePlace(text: string): number {
  const trimmed = text.trim();
  return /^\d+$/.test(trimmed) ? Number(trimmed) : Number.NaN;
}

/** The start values of each row: the stored zones of the plan, and the
 * default label of an automatic zone with no stored label. */
export function getInitialRows(plan: ZonePlan): Record<ZoneColour, ZoneRowValues> {
  const automatic = getAutomaticZones(plan);
  const stored = plan.zones ?? [];
  const rows = {} as Record<ZoneColour, ZoneRowValues>;
  for (const colour of ZONE_COLOURS) {
    const own = stored.find((zone) => zone.colour === colour);
    const auto = automatic.find((zone) => zone.colour === colour);
    rows[colour] = auto
      ? { on: true, from: '', to: '', label: own ? own.label : auto.label }
      : {
          on: Boolean(own?.places),
          from: own?.places ? String(own.places.from) : '',
          to: own?.places ? String(own.places.to) : '',
          label: own?.places ? own.label : '',
        };
  }
  return rows;
}

/** The zones to store (Task 189 choice 3): an automatic zone only with a
 * label that is not the default, and a free zone only when it is on. */
export function buildZones(
  plan: ZonePlan,
  rows: Record<ZoneColour, ZoneRowValues>
): PlanZone[] {
  const automatic = getAutomaticZones(plan);
  return ZONE_COLOURS.flatMap((colour): PlanZone[] => {
    const row = rows[colour];
    const auto = automatic.find((zone) => zone.colour === colour);
    if (auto) return row.label === auto.label ? [] : [{ colour, label: row.label }];
    if (!row.on) return [];
    return [
      {
        colour,
        places: { from: parsePlace(row.from), to: parsePlace(row.to) },
        label: row.label,
      },
    ];
  });
}

/** The user text of one zone problem (US-12.5). */
export function getZoneProblemText(problem: ZoneProblem): string {
  switch (problem.code) {
    case 'repeated-colour':
      return `Two zones are ${problem.colour}.`;
    case 'label-too-long':
      return `The ${problem.colour} zone label is longer than ${ZONE_LABEL_MAX} characters.`;
    case 'places-on-automatic':
      return `The ${problem.colour} zone follows the advancement. It has no places of its own.`;
    case 'missing-places':
    case 'bad-places':
      return `The ${problem.colour} zone needs whole places from 1, with "To" not before "From".`;
    case 'shared-place':
      return `The ${problem.colours[0]} zone and the ${problem.colours[1]} zone share a place.`;
  }
}
