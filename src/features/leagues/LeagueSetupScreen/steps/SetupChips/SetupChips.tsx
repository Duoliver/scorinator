import type { JSX } from 'preact';
import type SetupChipsProps from './types';
import styles from './SetupChips.module.css';

export type { SetupChipsProps };

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
