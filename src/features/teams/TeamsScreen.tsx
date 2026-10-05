import { useState } from 'preact/hooks';
import type { JSX } from 'preact';
import { Badge, Button, Table, type TableColumn } from '@/design-system';
import { TeamFormDrawer, type TeamRecord } from '@/features/components';
import { importTeamsFile } from '@/app/data/teamsFile';
import { importTeams } from '@/app/fileActions';
import { useTeamsStore } from '@/app/state/teamsStore';
import styles from './TeamsScreen.module.css';

type TeamDrawerState = { mode: 'create' } | { mode: 'edit'; index: number } | null;

interface TeamRow extends TeamRecord {
  rowKey: string;
  index: number;
}

export function TeamsScreen(): JSX.Element {
  const teams = useTeamsStore((state) => state.teams);
  const addTeam = useTeamsStore((state) => state.addTeam);
  const updateTeam = useTeamsStore((state) => state.updateTeam);
  const [drawer, setDrawer] = useState<TeamDrawerState>(null);

  const handleSave = (record: TeamRecord): void => {
    if (drawer?.mode === 'edit') {
      updateTeam(drawer.index, record);
    } else {
      addTeam(record);
    }
    setDrawer(null);
  };

  const rows: TeamRow[] = teams.map((team, index) => ({
    ...team,
    rowKey: `${team.slug}::${index}`,
    index,
  }));

  const columns: TableColumn<TeamRow>[] = [
    {
      key: 'colour',
      header: '',
      width: '2rem',
      render: (row) => (
        <div
          class={styles.swatch}
          style={{ background: row.colour || 'transparent' }}
        />
      ),
    },
    { key: 'name', header: 'Name' },
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
        <Button
          size="sm"
          variant="secondary"
          onClick={() => setDrawer({ mode: 'edit', index: row.index })}
        >
          Edit
        </Button>
      ),
    },
  ];

  return (
    <div class={styles.screen}>
      <div class={styles.header}>
        <h1>Teams</h1>
        <div class={styles.actions}>
          {/* The same one-dialog CSV-or-JSON import as the Leagues empty
              state. Export stays on the File screen only (Task 27). */}
          <Button
            variant="secondary"
            onClick={() => void importTeams(() => importTeamsFile())}
          >
            Import teams...
          </Button>
          <Button onClick={() => setDrawer({ mode: 'create' })}>+ New team</Button>
        </div>
      </div>

      <Table columns={columns} rows={rows} rowKey={(row) => row.rowKey} />

      <span class={styles.count}>{teams.length} teams</span>

      {drawer && (
        <TeamFormDrawer
          isEdit={drawer.mode === 'edit'}
          initial={drawer.mode === 'edit' ? teams[drawer.index] : undefined}
          onCancel={() => setDrawer(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
TeamsScreen.displayName = 'TeamsScreen';
