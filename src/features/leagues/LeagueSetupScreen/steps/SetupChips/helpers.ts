import type { PointsConfig } from '@/engine/standings';
import {
  formatHomeAdvantageLabel,
  formatPointsLabel,
} from '@/features/leagues/leagueSummary';

/** The chip text for the two Details-step settings, in one place, so the
 * Teams step summary and the Review step say the same thing. */
export function settingsChipLabels(
  homeAdvantage: boolean,
  points: PointsConfig
): string[] {
  return [formatHomeAdvantageLabel(homeAdvantage), formatPointsLabel(points)];
}
