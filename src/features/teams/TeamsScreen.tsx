import type { JSX } from 'preact';
import { Button, ConfirmDialog, Table } from '@/design-system';
import { TeamFormDrawer } from '@/features/components';
import { deleteTeamMessage, getRowKey } from './helpers';
import { useTeams } from './useTeams';
import styles from './TeamsScreen.module.css';

export function TeamsScreen(): JSX.Element {
  const {
    rows,
    columns,
    countText,
    drawer,
    editedTeam,
    takenSlugs,
    openCreateDrawer,
    closeDrawer,
    handleSave,
    handleDelete,
    deleteConfirm,
    confirmDelete,
    cancelDelete,
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

      <Table label="Teams" columns={columns} rows={rows} rowKey={getRowKey} />

      <span class={styles.count}>{countText}</span>

      {drawer && (
        <TeamFormDrawer
          isEdit={drawer.mode === 'edit'}
          initial={editedTeam}
          takenSlugs={takenSlugs}
          onCancel={closeDrawer}
          onSave={handleSave}
          onDelete={drawer.mode === 'edit' ? handleDelete : undefined}
        />
      )}

      {deleteConfirm && (
        <ConfirmDialog
          title={`Delete ${deleteConfirm.name}?`}
          message={deleteTeamMessage(deleteConfirm.leagueCount)}
          confirmLabel="Delete"
          tone="destructive"
          onConfirm={confirmDelete}
          onCancel={cancelDelete}
        />
      )}
    </div>
  );
}
TeamsScreen.displayName = 'TeamsScreen';
