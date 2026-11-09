import { useMemo } from 'preact/hooks';
import { planLeagueFileImport } from '@/app/importFileActions';
import {
  currentRows,
  isLeagueUnsaved,
  useDatabaseStore,
} from '@/app/state/databaseStore';
import { useFileImport } from '@/features/components';
import { formatLeagueCount } from './helpers';
import type { LeaguesDashboard } from './types';

/** The dashboard cards come from the manifest rows (Task 76 d), so the
 * dashboard reads no league file. An opened league gives its own row. */
export function useLeaguesDashboard(): LeaguesDashboard {
  const rows = useDatabaseStore((state) => state.rows);
  const leagues = useDatabaseStore((state) => state.leagues);
  const savedLeagues = useDatabaseStore((state) => state.savedLeagues);
  const { startFileImport, importDialogs } = useFileImport();

  const cards = useMemo(
    () =>
      currentRows({ rows, leagues }).map((row) => ({
        row,
        isUnsaved: isLeagueUnsaved({ leagues, savedLeagues }, row.uuid),
      })),
    [rows, leagues, savedLeagues]
  );

  return {
    leagues: cards,
    hasLeagues: cards.length > 0,
    subtitle: `${formatLeagueCount(cards.length)} running`,
    handleImportLeague: () => startFileImport(planLeagueFileImport),
    importDialogs,
  };
}
