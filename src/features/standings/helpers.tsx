import type { JSX } from 'preact';
import type { TableColumn } from '@/design-system';
import type { StandingsViewRow } from './types';
import styles from './StandingsView.module.css';

export const mono = (value: number, bold = false): JSX.Element => (
  <span class={bold ? styles.monoBold : styles.mono}>{value}</span>
);

export const rowKey = (row: StandingsViewRow): string => row.team;

/** The `#` column shows `positionText`, so a joint place reads `-` on every
 * row after the first of its tied block. */
export const COLUMNS: TableColumn<StandingsViewRow>[] = [
  {
    key: 'position',
    header: '#',
    width: '2.5rem',
    render: (row) => <span class={styles.monoBold}>{row.positionText}</span>,
  },
  {
    key: 'team',
    header: 'Team',
    render: (row) => (
      <span class={styles.team}>
        <span class={styles.swatch} style={{ background: row.teamColour }} />
        {row.teamName}
      </span>
    ),
  },
  { key: 'played', header: 'P', width: '2.75rem' },
  { key: 'won', header: 'W', width: '2.75rem' },
  { key: 'drawn', header: 'D', width: '2.75rem' },
  { key: 'lost', header: 'L', width: '2.75rem' },
  {
    key: 'goalsFor',
    header: 'GF',
    width: '3.25rem',
    render: (row) => mono(row.goalsFor),
  },
  {
    key: 'goalsAgainst',
    header: 'GA',
    width: '3.25rem',
    render: (row) => mono(row.goalsAgainst),
  },
  {
    key: 'goalDifference',
    header: 'GD',
    width: '3.25rem',
    render: (row) => mono(row.goalDifference),
  },
  {
    key: 'points',
    header: 'Pts',
    width: '3.5rem',
    render: (row) => mono(row.points, true),
  },
];
