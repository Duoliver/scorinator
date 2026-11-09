import type { JSX } from 'preact';
import type ImportRowLabelProps from './types';
import styles from './ImportRowLabel.module.css';

export type { ImportRowLabelProps };

/** The name and the UUID of one item of an import file. The app shows a
 * UUID only in the import dialogs (US-11.1). */
export function ImportRowLabel({ row }: ImportRowLabelProps): JSX.Element {
  return (
    <span class={styles.label}>
      <span class={styles.name}>{row.name}</span>
      <span class={styles.uuid}>{row.uuid}</span>
    </span>
  );
}
ImportRowLabel.displayName = 'ImportRowLabel';
