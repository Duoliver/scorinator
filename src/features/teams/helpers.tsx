import { Badge, Button, type TableColumn } from '@/design-system';
import type { TeamBlueprint } from '@/domain';
import { trigramFromName } from '@/engine/identity';
import { TeamSwatch } from '@/features/components';
import type { TeamRow } from './types';
import styles from './TeamsScreen.module.css';

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
