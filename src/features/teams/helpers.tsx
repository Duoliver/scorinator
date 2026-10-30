import { Badge, Button, type TableColumn } from '@/design-system';
import type { TeamBlueprint } from '@/domain';
import { trigramFromName } from '@/engine/identity';
import { TeamSwatch } from '@/features/components';
import type { TeamRow } from './types';
import styles from './TeamsScreen.module.css';

/** The text of the Delete confirm (US-09.4). With no league, the title
 * asks alone. */
export function deleteTeamMessage(leagueCount: number): string {
  if (leagueCount === 0) return '';
  if (leagueCount === 1) {
    return '1 league uses this team. It keeps its own copy, but loses its Location.';
  }
  return `${leagueCount} leagues use this team. They keep their own copy, but lose its Location.`;
}

export const toTeamRows = (teams: readonly TeamBlueprint[]): TeamRow[] =>
  teams.map((team, index) => ({ ...team, rowKey: `${team.slug}::${index}`, index }));

export const getRowKey = (row: TeamRow): string => row.rowKey;

/** The roster table columns. `onEdit` gets the row's index in the roster. */
export const getTeamColumns = (
  onEdit: (index: number) => void
): TableColumn<TeamRow>[] => [
  {
    key: 'colour',
    header: '',
    width: '2rem',
    render: (row) => <TeamSwatch colour={row.colour} size="lg" />,
  },
  { key: 'name', header: 'Name' },
  {
    key: 'location',
    header: 'Location',
    render: (row) =>
      row.location === '' ? <span class={styles.muted}>—</span> : row.location,
  },
  {
    key: 'trigrams',
    header: 'Trigrams',
    render: (row) =>
      row.trigrams.length > 0 ? (
        <span class={styles.trigrams}>{row.trigrams.join(' · ')}</span>
      ) : (
        // An empty list means the trigram made from the name (US-09.6).
        <span class={`${styles.trigrams} ${styles.muted}`}>
          {trigramFromName(row.name)}
        </span>
      ),
  },
  {
    key: 'tier',
    header: 'Tier',
    width: '5rem',
    render: (row) => <Badge tone="dark">{row.tier}</Badge>,
  },
  {
    key: 'slug',
    header: 'Slug',
    render: (row) => <span class={styles.slug}>{row.slug}</span>,
  },
  {
    key: 'actions',
    header: '',
    width: '5rem',
    align: 'right',
    render: (row) => (
      <Button size="sm" variant="secondary" onClick={() => onEdit(row.index)}>
        Edit
      </Button>
    ),
  },
];
