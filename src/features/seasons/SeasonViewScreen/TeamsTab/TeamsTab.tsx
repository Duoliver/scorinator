import type { JSX } from 'preact';
import { Table } from '@/design-system';
import { formatCount } from '@/features/seasons/seasonText';
import { getRosterColumns, getRowKey } from './helpers';
import type TeamsTabProps from './types';
import styles from './TeamsTab.module.css';

export type { TeamsTabProps };
export type { RosterRow } from './types';

/** The Season roster, in join order (US-13.4). */
export function TeamsTab({ rows, isFinished, onEdit }: TeamsTabProps): JSX.Element {
  if (rows.length === 0) {
    return <p class={styles.muted}>No teams yet. Add teams from the Teams module.</p>;
  }
  return (
    <div class={styles.tab}>
      <Table
        label="Season roster"
        columns={getRosterColumns(isFinished, onEdit)}
        rows={[...rows]}
        rowKey={getRowKey}
      />
      <span class={styles.muted}>
        {formatCount(rows.length, 'team')} in the roster. A team cannot leave the
        Season.
      </span>
    </div>
  );
}
TeamsTab.displayName = 'TeamsTab';
