import type { JSX } from 'preact';
import { ConfirmDialog, Table, type TableColumn } from '@/design-system';
import { TeamSwatch } from '@/features/components';
import type SeedListProps from './types';
import type { SeedRow } from './types';
import { useSeedList } from './useSeedList';
import styles from './SeedList.module.css';

export type { SeedListProps };

/**
 * The Seed List of a bracket phase (Task 142, US-04.2, US-04.10): the bye
 * text and count, then one row for each qualifier: the seed, the team, the
 * tag of its place in the phase before, and the bye star (choice 4).
 */
export function SeedList(props: SeedListProps): JSX.Element {
  const view = useSeedList(props);
  const columns: TableColumn<SeedRow>[] = [
    { key: 'seed', header: '#', width: '2.5rem', render: (row) => row.seed },
    {
      key: 'team',
      header: 'Team',
      render: (row) => (
        <span class={styles.team}>
          <TeamSwatch colour={row.colour} size="sm" />
          {row.name}
        </span>
      ),
    },
    ...(view.hasTags
      ? [
          {
            key: 'tag',
            header: 'From',
            width: '4rem',
            render: (row: SeedRow) => row.tag,
          },
        ]
      : []),
    {
      key: 'bye',
      header: 'Bye',
      width: '3.5rem',
      align: 'center',
      render: (row) => (
        <button
          type="button"
          class={`${styles.star} ${row.hasBye ? styles.starOn : ''}`}
          aria-label={`Bye for ${row.name}`}
          aria-pressed={row.hasBye}
          disabled={row.starDisabled}
          onClick={() => view.toggleBye(row.key)}
        >
          {row.hasBye ? '★' : '☆'}
        </button>
      ),
    },
  ];

  return (
    <div class={styles.list}>
      <div class={styles.header}>
        <p class={styles.text}>{view.text}</p>
        {view.count && <span class={styles.count}>{view.count}</span>}
      </div>
      <Table
        label="Seed List"
        columns={columns}
        rows={view.rows}
        rowKey={(row) => row.key}
      />
      {view.confirm && <ConfirmDialog {...view.confirm} />}
    </div>
  );
}
SeedList.displayName = 'SeedList';
