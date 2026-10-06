import type { JSX } from 'preact';
import type { PointsConfig } from '@/engine/standings';
import styles from './SetupChips.module.css';

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

interface SetupChipsProps {
  labels: readonly string[];
}

/** A row of small bordered chips: the League Setup summary look, shared by
 * the Teams step (Task 33) and the Review step. */
export function SetupChips({ labels }: SetupChipsProps): JSX.Element {
  return (
    <div class={styles.chips}>
      {labels.map((label) => (
        <span key={label} class={styles.chip}>
          {label}
        </span>
      ))}
    </div>
  );
}
SetupChips.displayName = 'SetupChips';
