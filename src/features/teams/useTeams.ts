import { useState } from 'preact/hooks';
import type { TeamFields } from '@/domain';
import { formatTeamCount, useTeamImport } from '@/features/components';
import { getErrorMessage } from '@/app/getErrorMessage';
import { readTeamsFromFile } from '@/app/loadActions';
import { setFileStatus } from '@/app/state/fileActions';
import {
  addTeamBlueprint,
  countLeaguesUsingBlueprint,
  deleteTeamBlueprint,
  updateTeamBlueprint,
} from '@/app/state/teamBlueprintActions';
import { useDatabaseStore } from '@/app/state/databaseStore';
import { getTeamColumns, toTeamRows } from './helpers';
import type { TeamDeleteConfirm, TeamDrawerState, Teams } from './types';

/** The Blueprints, and the one drawer that creates or edits a team. The
 * import is the same one-dialog CSV-or-JSON import as the Leagues empty
 * state, and asks first with the counts (Task 168). Export stays on the File screen only (Task 27).
 *
 * A create takes no slug from the form: `addTeamBlueprint` makes a unique one
 * (Task 75). An edit keeps the slug, unless the user regenerates it in the
 * drawer (US-09.5). Delete asks first, with the league count (US-09.4). */
export function useTeams(): Teams {
  const teams = useDatabaseStore((state) => state.blueprints);
  const [drawer, setDrawer] = useState<TeamDrawerState>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<TeamDeleteConfirm | null>(null);
  const editedTeam = drawer?.mode === 'edit' ? teams[drawer.index] : undefined;
  const { startImport, importConfirm } = useTeamImport();

  const handleSave = (record: TeamFields): void => {
    const { name, colour, tier, location, trigrams } = record;
    const fields = { name, colour, tier, location, trigrams };
    if (editedTeam) {
      updateTeamBlueprint(editedTeam.uuid, { ...fields, slug: record.slug });
    } else {
      addTeamBlueprint(fields);
    }
    setDrawer(null);
  };

  const handleDelete = async (): Promise<void> => {
    if (!editedTeam) return;
    const { uuid, name } = editedTeam;
    try {
      const leagueCount = await countLeaguesUsingBlueprint(uuid);
      setDeleteConfirm({ uuid, name, leagueCount });
    } catch (error) {
      setFileStatus({ tone: 'error', message: getErrorMessage(error) });
    }
  };

  const confirmDelete = (): void => {
    if (deleteConfirm) deleteTeamBlueprint(deleteConfirm.uuid);
    setDeleteConfirm(null);
    setDrawer(null);
  };

  return {
    rows: toTeamRows(teams),
    columns: getTeamColumns((index) => setDrawer({ mode: 'edit', index })),
    countText: formatTeamCount(teams.length),
    drawer,
    editedTeam,
    takenSlugs: teams.map((team) => team.slug),
    openCreateDrawer: () => setDrawer({ mode: 'create' }),
    closeDrawer: () => setDrawer(null),
    handleSave,
    handleDelete,
    deleteConfirm,
    confirmDelete,
    cancelDelete: () => setDeleteConfirm(null),
    handleImport: () => startImport(readTeamsFromFile),
    importConfirm,
  };
}
