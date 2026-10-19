import {
  applyLoadedLeague,
  importTeamsFromFile,
  openLeagueFile,
} from '@/app/loadActions';
import type { LeaguesEmptyStateHandlers } from './types';

export function useLeaguesEmptyState(): LeaguesEmptyStateHandlers {
  // With no league open, a loaded league cannot replace one, so this needs
  // no confirm step, unlike the File screen.
  const handleLoadLeague = async (): Promise<void> => {
    const loaded = await openLeagueFile();
    if (loaded !== null) applyLoadedLeague(loaded);
  };

  return { handleLoadTeams: importTeamsFromFile, handleLoadLeague };
}
