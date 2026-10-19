import type { JSX } from 'preact';
import { Button, Table } from '@/design-system';
import { TeamFormDrawer } from '@/features/components';
import { getRowKey } from './helpers';
import { useTeams } from './useTeams';
import styles from './TeamsScreen.module.css';

export function TeamsScreen(): JSX.Element {
  const {
    rows,
    columns,
    countText,
    drawer,
    editedTeam,
    openCreateDrawer,
    closeDrawer,
    handleSave,
    handleImport,
  } = useTeams();

  return (
    <div class={styles.screen}>
      <div class={styles.header}>
        <h1>Teams</h1>
        <div class={styles.actions}>
          <Button variant="secondary" onClick={handleImport}>
            Import teams...
          </Button>
          <Button onClick={openCreateDrawer}>+ New team</Button>
        </div>
      </div>

      <Table columns={columns} rows={rows} rowKey={getRowKey} />

      <span class={styles.count}>{countText}</span>

      {drawer && (
        <TeamFormDrawer
          isEdit={drawer.mode === 'edit'}
          initial={editedTeam}
          onCancel={closeDrawer}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
TeamsScreen.displayName = 'TeamsScreen';
