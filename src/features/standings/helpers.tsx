import type { JSX } from 'preact';
import type { TableColumn, TableRowTone } from '@/design-system';
import { TeamSwatch } from '@/features/components';
import type { StandingsViewRow } from './types';
import styles from './StandingsView.module.css';

export const mono = (value: number, bold = false): JSX.Element => (
  <span class={bold ? styles.monoBold : styles.mono}>{value}</span>
);

export const rowKey = (row: StandingsViewRow): string => row.team;

/** The tint of a row (Task 132 choice 9): a qualifier place is "positive",
 * a place N + 1 of a best M is the lighter "caution". */
export const rowTone = (row: StandingsViewRow): TableRowTone | undefined => {
  if (row.mark === 'qualifier') return 'positive';
  return row.mark === 'best-of-next' ? 'caution' : undefined;
};

function getColumn(key: string): TableColumn<StandingsViewRow> {
  const column = COLUMNS.find((candidate) => candidate.key === key);
  if (!column) throw new Error(`No standings column ${key}.`);
  return column;
}

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
        <TeamSwatch colour={row.teamColour} size="sm" />
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

/** The columns of a group card (Task 131 choice 5, US-02.2): #, Team, W, D,
 * L, GD, Pts. Narrow tracks, so a compact table fits a 280px card, and the
 * Team column takes the rest of a wider card. */
export const GROUP_COLUMNS: TableColumn<StandingsViewRow>[] = [
  { ...getColumn('position'), width: '1.5rem' },
  {
    key: 'team',
    header: 'Team',
    width: 'minmax(0, 1fr)',
    // The name cuts with an ellipsis, so a long name keeps the card width.
    render: (row) => (
      <span class={styles.team}>
        <TeamSwatch colour={row.teamColour} size="sm" />
        <span class={styles.teamName}>{row.teamName}</span>
      </span>
    ),
  },
  { key: 'won', header: 'W', width: '1.25rem' },
  { key: 'drawn', header: 'D', width: '1.25rem' },
  { key: 'lost', header: 'L', width: '1.25rem' },
  { ...getColumn('goalDifference'), width: '1.75rem' },
  { ...getColumn('points'), width: '1.75rem' },
];
