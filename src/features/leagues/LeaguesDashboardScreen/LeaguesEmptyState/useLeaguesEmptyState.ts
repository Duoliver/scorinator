import { planLeagueFileImport } from '@/app/importFileActions';
import { readTeamsFromFile } from '@/app/loadActions';
import { useFileImport, useTeamImport } from '@/features/components';
import type { LeaguesEmptyStateHandlers } from './types';

/** The ways to begin with no leagues. The team import asks first, with the
 * counts (Task 168). The league import has the same steps as the File
 * screen (choice 8). */
export function useLeaguesEmptyState(): LeaguesEmptyStateHandlers {
  const { startImport, importConfirm } = useTeamImport();
  const { startFileImport, importDialogs } = useFileImport();
  return {
    handleLoadTeams: () => startImport(readTeamsFromFile),
    handleImportLeague: () => startFileImport(planLeagueFileImport),
    importConfirm,
    importDialogs,
  };
}
