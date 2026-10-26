import { useState } from 'preact/hooks';
import type { LoadedLeagueFile } from '@/app/data/leagueFile';
import { applyLoadedLeague, isLeagueOpen, openLeagueFile } from '@/app/loadActions';
import type { LeagueLoad } from './types';

/** Loads a league save file. When a league with the same slug is already
 * open, it holds the loaded file and waits for Replace or Cancel, so the
 * open league does not change before the user agrees. */
export function useLeagueLoad(): LeagueLoad {
  const [pendingLoad, setPendingLoad] = useState<LoadedLeagueFile | null>(null);

  const handleLoad = async (): Promise<void> => {
    const loaded = await openLeagueFile();
    if (loaded === null) return;
    if (isLeagueOpen(loaded.league.slug)) {
      setPendingLoad(loaded);
      return;
    }
    applyLoadedLeague(loaded);
  };

  return {
    pendingLeagueName: pendingLoad?.league.name ?? null,
    handleLoad,
    confirmReplace: (): void => {
      if (pendingLoad) applyLoadedLeague(pendingLoad);
      setPendingLoad(null);
    },
    cancelReplace: (): void => setPendingLoad(null),
  };
}
