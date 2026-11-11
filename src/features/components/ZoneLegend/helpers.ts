import type { PhaseZone } from '@/engine/phases';

/** The legend text of a zone (US-12.5): its label, or its places when it
 * has no label, for example "Places 18–20" or "Place 3" (Task 155 choice
 * 7). */
export const getZoneLegendText = (zone: PhaseZone): string => {
  if (zone.label) return zone.label;
  return zone.from === zone.to
    ? `Place ${zone.from}`
    : `Places ${zone.from}–${zone.to}`;
};
