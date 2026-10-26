import { useState } from 'preact/hooks';
import type { TeamRecord } from '@/domain';
import { formatTeamCount } from '@/features/components';
import { importTeamsFromFile } from '@/app/loadActions';
import { addTeam, updateTeam } from '@/app/state/teamsActions';
import { useTeamsStore } from '@/app/state/teamsStore';
import { getTeamColumns, toTeamRows } from './helpers';
import type { TeamDrawerState, Teams } from './types';

/** The roster, and the one drawer that creates or edits a team. The import
 * is the same one-dialog CSV-or-JSON import as the Leagues empty state.
 * Export stays on the File screen only (Task 27). */
export function useTeams(): Teams {
  const teams = useTeamsStore((state) => state.teams);
  const [drawer, setDrawer] = useState<TeamDrawerState>(null);

  const handleSave = (record: TeamRecord): void => {
    if (drawer?.mode === 'edit') {
      updateTeam(drawer.index, record);
    } else {
      addTeam(record);
    }
    setDrawer(null);
  };

  return {
    rows: toTeamRows(teams),
    columns: getTeamColumns((index) => setDrawer({ mode: 'edit', index })),
    countText: formatTeamCount(teams.length),
    drawer,
    editedTeam: drawer?.mode === 'edit' ? teams[drawer.index] : undefined,
    openCreateDrawer: () => setDrawer({ mode: 'create' }),
    closeDrawer: () => setDrawer(null),
    handleSave,
    handleImport: importTeamsFromFile,
  };
}
