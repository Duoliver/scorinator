import type { JSX } from 'preact';
import { Table } from '@/design-system';
import type StandingsViewProps from './types';
import { COLUMNS, GROUP_COLUMNS, rowKey, rowTone } from './helpers';
import { useStandings } from './useStandings';
import styles from './StandingsView.module.css';

export type { StandingsViewProps };

/** The tables of one phase of one league: the league table of a round
 * robin, or one card for each group of a Groups phase (Task 131), with the
 * qualifier tints and the advancement line (Task 132).
 * `useStandings` gives the rows, and `helpers.tsx` holds the static column
 * setup. */
export function StandingsView({
  league,
  phaseIndex,
  advanceText,
}: StandingsViewProps): JSX.Element {
  const { isGroups, tables, hasTeams, hasResults } = useStandings(league, phaseIndex);

  if (!hasTeams) {
    return <p class={styles.note}>No teams in this league yet.</p>;
  }

  return (
    <div class={styles.view}>
      {isGroups ? (
        <div class={styles.cards}>
          {tables.map((table) => (
            <section class={styles.card} key={table.name}>
              <h3 class={styles.cardName}>{table.name}</h3>
              <Table
                label={table.name}
                columns={GROUP_COLUMNS}
                rows={table.rows}
                rowKey={rowKey}
                rowTone={rowTone}
                compact
              />
            </section>
          ))}
        </div>
      ) : (
        <div class={styles.scroller}>
          <div class={styles.sheet}>
            {tables.map((table) => (
              <Table
                key={table.name}
                label={table.name}
                columns={COLUMNS}
                rows={table.rows}
                rowKey={rowKey}
                rowTone={rowTone}
              />
            ))}
          </div>
        </div>
      )}
      {advanceText && <p class={styles.note}>{advanceText}</p>}
      {!hasResults && <p class={styles.note}>No matches played yet.</p>}
    </div>
  );
}
StandingsView.displayName = 'StandingsView';
