import type { JSX } from 'preact';
import { useMemo } from 'preact/hooks';
import { Table, type TableColumn } from '@/design-system';
import { calculateStandings, type StandingsRow } from '@/engine/standings';
import { useTeamsStore } from '@/app/state/teamsStore';
import type { LeagueRecord } from '@/features/leagues/types';
import styles from './StandingsView.module.css';

interface StandingsViewProps {
  league: LeagueRecord;
}

interface TeamDisplay {
  name: string;
  colour: string;
}

/** The league table for one league, recomputed from `league.results` on
 * every render — `calculateStandings` is a pure recompute (Task 4), so
 * "live update" needs no state here. `LeagueDetailScreen` already
 * re-renders with a fresh `league` whenever `useLeagueStore` changes,
 * which is what a scorinate action (Task 15) does. The `#` column shows
 * `positionText`, so a joint place reads `-` on every row after the
 * first of its tied block. */
export function StandingsView({ league }: StandingsViewProps): JSX.Element {
  const teams = useTeamsStore((state) => state.teams);

  const rows = useMemo(
    () =>
      calculateStandings(
        league.teams.map((team) => team.slug),
        league.results,
        league.points
      ),
    [league]
  );

  if (league.teams.length === 0) {
    return <p class={styles.note}>No teams in this league yet.</p>;
  }

  const teamDisplay = (slug: string): TeamDisplay => {
    const team = teams.find((candidate) => candidate.slug === slug);
    return team ? { name: team.name, colour: team.colour } : { name: slug, colour: '' };
  };

  const mono = (value: number, bold = false): JSX.Element => (
    <span class={bold ? styles.monoBold : styles.mono}>{value}</span>
  );

  const columns: TableColumn<StandingsRow<string>>[] = [
    {
      key: 'position',
      header: '#',
      width: '2.5rem',
      render: (row) => <span class={styles.monoBold}>{row.positionText}</span>,
    },
    {
      key: 'team',
      header: 'Team',
      render: (row): JSX.Element => {
        const { name, colour } = teamDisplay(row.team);
        return (
          <span class={styles.team}>
            <span class={styles.swatch} style={{ background: colour }} />
            {name}
          </span>
        );
      },
    },
    { key: 'played', header: 'P', width: '2.75rem' },
    { key: 'won', header: 'W', width: '2.75rem' },
    { key: 'drawn', header: 'D', width: '2.75rem' },
    { key: 'lost', header: 'L', width: '2.75rem' },
    { key: 'goalsFor', header: 'GF', width: '3.25rem', render: (row) => mono(row.goalsFor) },
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
    { key: 'points', header: 'Pts', width: '3.5rem', render: (row) => mono(row.points, true) },
  ];

  return (
    <div class={styles.view}>
      <div class={styles.scroller}>
        <div class={styles.sheet}>
          <Table columns={columns} rows={rows} rowKey={(row) => row.team} />
        </div>
      </div>
      {league.results.length === 0 && <p class={styles.note}>No matches played yet.</p>}
    </div>
  );
}
StandingsView.displayName = 'StandingsView';
