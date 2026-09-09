import { useState } from 'preact/hooks';
import type { JSX } from 'preact';
import { Badge, Button, Table, type TableColumn } from '../../design-system';
import { TeamForm } from './TeamForm';
import { exportTeamsCsv, importTeamsCsv } from './csvIO';
import { importTeamsJson } from './jsonIO';
import {
  csvRecordToTeamRecord,
  mergeImportedTeams,
  teamRecordToCsvRecord,
} from './importMerge';
import type { TeamRecord } from './types';

type Drawer = { mode: 'create' } | { mode: 'edit'; index: number } | null;

interface TeamRow extends TeamRecord {
  rowKey: string;
  index: number;
}

export function TeamsScreen(): JSX.Element {
  const [teams, setTeams] = useState<TeamRecord[]>([]);
  const [drawer, setDrawer] = useState<Drawer>(null);
  const [status, setStatus] = useState<string | null>(null);

  const handleSave = (record: TeamRecord): void => {
    setTeams((current) => {
      if (drawer?.mode === 'edit') {
        const next = [...current];
        next[drawer.index] = record;
        return next;
      }
      return [...current, record];
    });
    setDrawer(null);
  };

  const handleImportCsv = async (): Promise<void> => {
    try {
      const imported = await importTeamsCsv();
      if (imported === null) return;
      const records = imported.map(csvRecordToTeamRecord);
      setTeams((current) => mergeImportedTeams(current, records));
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
      setTeams((current) => mergeImportedTeams(current, records));
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
        <div
          style={{
            width: '1.125rem',
            height: '1.125rem',
            border: '2px solid var(--color-fg)',
            background: row.colour || 'transparent',
          }}
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
      render: (row) => (
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.8125rem',
            color: 'var(--color-fg-muted)',
          }}
        >
          {row.slug}
        </span>
      ),
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
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1.75rem',
        padding: '2.5rem 3rem',
        maxWidth: '65rem',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          gap: '1rem',
        }}
      >
        <h1 style={{ margin: 0, fontFamily: 'var(--font-heading)', fontSize: '2rem' }}>
          Teams
        </h1>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
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

      <span style={{ fontSize: '0.8125rem', color: 'var(--color-fg-muted)' }}>
        {teams.length} teams
      </span>

      {status && (
        <span style={{ fontSize: '0.875rem', color: 'var(--color-fg-muted)' }}>
          {status}
        </span>
      )}

      {drawer && (
        <TeamForm
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
