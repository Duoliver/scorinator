import type { JSX } from 'preact';
import { Table } from '@/design-system';
import type StandingsViewProps from './types';
import { COLUMNS, GROUP_COLUMNS, getZoneLegendText, rowKey, rowTone } from './helpers';
import { useStandings } from './useStandings';
import styles from './StandingsView.module.css';

export type { StandingsViewProps };

/** The tables of one phase of one league: the league table of a round
 * robin, or one card for each group of a Groups phase (Task 131), with the
 * zones and their legend (Task 155) and the advancement line (Task 132).
 * `useStandings` gives the rows, and `helpers.tsx` holds the static column
 * setup. */
export function StandingsView({
  league,
  phaseIndex,
  advanceText,
}: StandingsViewProps): JSX.Element {
  const { isGroups, tables, zones, hasTeams, hasResults } = useStandings(
    league,
    phaseIndex
  );

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
      {zones.length > 0 && (
        <ul class={styles.legend} aria-label="Zones">
          {zones.map((zone) => (
            <li class={styles.legendItem} key={zone.colour}>
              <span class={styles.legendSwatch} data-zone={zone.colour} />
              {getZoneLegendText(zone)}
            </li>
          ))}
        </ul>
      )}
      {advanceText && <p class={styles.note}>{advanceText}</p>}
      {!hasResults && <p class={styles.note}>No matches played yet.</p>}
    </div>
  );
}
StandingsView.displayName = 'StandingsView';
