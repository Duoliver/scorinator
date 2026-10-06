import type { JSX } from 'preact';
import { Table } from '@/design-system';
import type StandingsViewProps from './types';
import { COLUMNS, rowKey } from './helpers';
import { useStandings } from './useStandings';
import styles from './StandingsView.module.css';

export type { StandingsViewProps };

/** The league table for one league. `useStandings` gives the rows, and
 * `helpers.tsx` holds the static column setup. */
export function StandingsView({ league }: StandingsViewProps): JSX.Element {
  const { rows, hasTeams, hasResults } = useStandings(league);

  if (!hasTeams) {
    return <p class={styles.note}>No teams in this league yet.</p>;
  }

  return (
    <div class={styles.view}>
      <div class={styles.scroller}>
        <div class={styles.sheet}>
          <Table columns={COLUMNS} rows={rows} rowKey={rowKey} />
        </div>
      </div>
      {!hasResults && <p class={styles.note}>No matches played yet.</p>}
    </div>
  );
}
StandingsView.displayName = 'StandingsView';
