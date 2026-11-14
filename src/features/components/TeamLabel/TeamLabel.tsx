import type { JSX } from 'preact';
import type TeamLabelProps from './types';
import styles from './TeamLabel.module.css';

export type { TeamLabelProps };

/** A team name with its Location below it, or on its line with `inline`, in
 * smaller muted text. Shared by the Teams step list, the add dialog rows,
 * and the Review step. It takes
 * the free width of its row, so the item after it sits at the row end
 * (Task 120 review). */
export function TeamLabel({
  name,
  location,
  inline = false,
}: TeamLabelProps): JSX.Element {
  return (
    <span class={inline ? `${styles.label} ${styles.inline}` : styles.label}>
      <span>{name}</span>
      {location !== '' && <span class={styles.location}>{location}</span>}
    </span>
  );
}
TeamLabel.displayName = 'TeamLabel';
