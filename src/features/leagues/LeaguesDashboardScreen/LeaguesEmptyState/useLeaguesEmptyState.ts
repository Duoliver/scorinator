import { importTeamsFromFile } from '@/app/loadActions';
import type { LeaguesEmptyStateHandlers } from './types';

/** The empty state loads teams only. A league lives in the database, and
 * Task 149 (M5) adds the league import (Task 161). */
export function useLeaguesEmptyState(): LeaguesEmptyStateHandlers {
  return { handleLoadTeams: importTeamsFromFile };
}
