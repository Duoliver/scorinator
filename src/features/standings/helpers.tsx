import type { JSX } from 'preact';
import { Tooltip, type TableColumn, type TableRowTone } from '@/design-system';
import { TeamSwatch } from '@/features/components';
import type { FormDot, StandingsViewRow } from './types';
import styles from './StandingsView.module.css';

export const mono = (value: number, bold = false): JSX.Element => (
  <span class={bold ? styles.monoBold : styles.mono}>{value}</span>
);

/** The number of dots in the Form column (US-12.1). */
export const FORM_LENGTH = 5;

/** The goals behind the goal difference (US-12.2). */
const renderGoalDifference = (row: StandingsViewRow): JSX.Element => (
  <Tooltip underline content={`Scored ${row.goalsFor} · Conceded ${row.goalsAgainst}`}>
    {mono(row.goalDifference)}
  </Tooltip>
);

const renderFormHint = (dot: FormDot): JSX.Element => (
  <span class={styles.formHint}>
    <TeamSwatch colour={dot.opponentColour} size="sm" />
    <span class={dot.isTrigram ? styles.mono : undefined}>{dot.opponent}</span>
    {` · ${dot.venue} · ${dot.score} · MD ${dot.matchday}`}
  </span>
);

const renderForm = (row: StandingsViewRow): JSX.Element => {
  if (row.form.length === 0) return <span>—</span>;
  return (
    <span class={styles.form}>
      {row.form.map((dot) => (
        <Tooltip key={dot.matchday} content={renderFormHint(dot)}>
          <span class={styles.dot} data-outcome={dot.outcome}>
            {dot.outcome}
          </span>
        </Tooltip>
      ))}
    </span>
  );
};

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
    headerHint: 'Position',
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
  { key: 'played', header: 'P', headerHint: 'Played', width: '2.75rem' },
  { key: 'won', header: 'W', headerHint: 'Won', width: '2.75rem' },
  { key: 'drawn', header: 'D', headerHint: 'Drawn', width: '2.75rem' },
  { key: 'lost', header: 'L', headerHint: 'Lost', width: '2.75rem' },
  {
    key: 'goalDifference',
    header: 'GD',
    headerHint: 'Goal difference',
    width: '3.25rem',
    render: renderGoalDifference,
  },
  {
    key: 'points',
    header: 'Pts',
    headerHint: 'Points',
    width: '3.5rem',
    render: (row) => mono(row.points, true),
  },
  {
    key: 'form',
    header: 'Form',
    headerHint: 'Last 5 matches',
    width: '8.5rem',
    render: renderForm,
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
  { ...getColumn('won'), width: '1.25rem' },
  { ...getColumn('drawn'), width: '1.25rem' },
  { ...getColumn('lost'), width: '1.25rem' },
  { ...getColumn('goalDifference'), width: '1.75rem' },
  { ...getColumn('points'), width: '1.75rem' },
];
