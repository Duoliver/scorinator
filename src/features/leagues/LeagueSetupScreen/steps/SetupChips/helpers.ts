import type { PointsConfig } from '@/engine/standings';

/** The chip text for the two Details-step settings, in one place, so the
 * Teams step summary and the Review step say the same thing. */
export function settingsChipLabels(
  homeAdvantage: boolean,
  points: PointsConfig
): string[] {
  return [
    `Home adv. ${homeAdvantage ? 'on' : 'off'}`,
    `${points.win}/${points.draw}/${points.loss} pts`,
  ];
}
