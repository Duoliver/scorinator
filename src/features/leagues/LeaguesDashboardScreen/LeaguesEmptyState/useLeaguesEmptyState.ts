import { readTeamsFromFile } from '@/app/loadActions';
import { useTeamImport } from '@/features/components';
import type { LeaguesEmptyStateHandlers } from './types';

/** The empty state loads teams only. A league lives in the database, and
 * Task 149 (M5) adds the league import (Task 161). The team import asks
 * first, with the counts (Task 168). */
export function useLeaguesEmptyState(): LeaguesEmptyStateHandlers {
  const { startImport, importConfirm } = useTeamImport();
  return { handleLoadTeams: () => startImport(readTeamsFromFile), importConfirm };
}
