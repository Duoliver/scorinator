import { useState } from 'preact/hooks';
import type { JSX } from 'preact';
import { Badge, Button, Table, type TableColumn } from '../../design-system';
import { TeamForm, type TeamRecord } from '../components';
import { useTeamsStore } from '../../app/state/teamsStore';
import { exportTeamsCsv, importTeamsCsv } from './csvIO';
import { importTeamsJson } from './jsonIO';
import {
  csvRecordToTeamRecord,
  mergeImportedTeams,
  teamRecordToCsvRecord,
} from './importMerge';
import styles from './TeamsScreen.module.css';

type Drawer = { mode: 'create' } | { mode: 'edit'; index: number } | null;

interface TeamRow extends TeamRecord {
  rowKey: string;
  index: number;
}

export function TeamsScreen(): JSX.Element {
  const teams = useTeamsStore((state) => state.teams);
  const addTeam = useTeamsStore((state) => state.addTeam);
  const updateTeam = useTeamsStore((state) => state.updateTeam);
  const setTeams = useTeamsStore((state) => state.setTeams);
  const [drawer, setDrawer] = useState<Drawer>(null);
  const [status, setStatus] = useState<string | null>(null);

  const handleSave = (record: TeamRecord): void => {
    if (drawer?.mode === 'edit') {
      updateTeam(drawer.index, record);
    } else {
      addTeam(record);
    }
    setDrawer(null);
  };

  const handleImportCsv = async (): Promise<void> => {
    try {
      const imported = await importTeamsCsv();
      if (imported === null) return;
      const records = imported.map(csvRecordToTeamRecord);
      setTeams(mergeImportedTeams(teams, records));
      setStatus(`Imported ${records.length} team${records.length === 1 ? '' : 's'}.`);
    } catch (error) {
      setStatus((error as Error).message);
    }
  };

  const handleImportJson = async (): Promise<void> => {
    try {
      const imported = await importTeamsJson();
      if (imported === null) return;
      const records = imported.map(csvRecordToTeamRecord);
      setTeams(mergeImportedTeams(teams, records));
      setStatus(`Imported ${records.length} team${records.length === 1 ? '' : 's'}.`);
    } catch (error) {
      setStatus((error as Error).message);
    }
  };

  const handleExport = async (): Promise<void> => {
    try {
      const path = await exportTeamsCsv(teams.map(teamRecordToCsvRecord));
      setStatus(path === null ? 'Export canceled.' : `Saved to ${path}`);
    } catch (error) {
      setStatus((error as Error).message);
    }
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
        <div class={styles.swatch} style={{ background: row.colour || 'transparent' }} />
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
          <Button variant="secondary" onClick={handleImportJson}>
            Import JSON...
          </Button>
          <Button variant="secondary" onClick={handleImportCsv}>
            Import CSV...
          </Button>
          <Button variant="secondary" onClick={handleExport}>
            Export CSV...
          </Button>
          <Button onClick={() => setDrawer({ mode: 'create' })}>+ New team</Button>
        </div>
      </div>

      <Table columns={columns} rows={rows} rowKey={(row) => row.rowKey} />

      <span class={styles.count}>{teams.length} teams</span>

      {status && <span class={styles.status}>{status}</span>}

      {drawer && (
        <TeamForm
          key={drawer.mode === 'edit' ? `edit-${drawer.index}` : 'create'}
          title={drawer.mode === 'create' ? 'New team' : 'Edit team'}
          saveLabel={drawer.mode === 'create' ? 'Create team' : 'Save changes'}
          initial={drawer.mode === 'edit' ? teams[drawer.index] : undefined}
          onCancel={() => setDrawer(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
TeamsScreen.displayName = 'TeamsScreen';
