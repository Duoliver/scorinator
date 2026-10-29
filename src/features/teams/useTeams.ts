import { useState } from 'preact/hooks';
import type { TeamFields } from '@/domain';
import { formatTeamCount } from '@/features/components';
import { importTeamsFromFile } from '@/app/loadActions';
import {
  addTeamBlueprint,
  updateTeamBlueprint,
} from '@/app/state/teamBlueprintActions';
import { useDatabaseStore } from '@/app/state/databaseStore';
import { getTeamColumns, toTeamRows } from './helpers';
import type { TeamDrawerState, Teams } from './types';

/** The Blueprints, and the one drawer that creates or edits a team. The
 * import is the same one-dialog CSV-or-JSON import as the Leagues empty
 * state. Export stays on the File screen only (Task 27).
 *
 * A create takes no slug from the form: `addTeamBlueprint` makes a unique one
 * (Task 75). An edit keeps the slug (US-09.5). */
export function useTeams(): Teams {
  const teams = useDatabaseStore((state) => state.blueprints);
  const [drawer, setDrawer] = useState<TeamDrawerState>(null);

  const handleSave = (record: TeamFields): void => {
    const { name, colour, tier } = record;
    if (drawer?.mode === 'edit') {
      updateTeamBlueprint(teams[drawer.index].uuid, { name, colour, tier });
    } else {
      addTeamBlueprint({ name, colour, tier });
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
