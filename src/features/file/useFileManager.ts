import {
  exportAllBlueprints,
  exportAllLeagues,
  exportDatabase,
  exportTeams,
} from '@/app/exportActions';
import {
  planBlueprintFileImport,
  planDatabaseFileImport,
  planLeagueFileImport,
} from '@/app/importFileActions';
import { readTeamsFromCsv } from '@/app/loadActions';
import { currentRows, useDatabaseStore } from '@/app/state/databaseStore';
import { useFileImport, useTeamImport } from '@/features/components';
import type { FileManager } from './types';

/** The File screen (US-10.2 to US-10.4): the bulk exports and imports. Every
 * action reports on the status line. The quick CSV keeps its own confirm,
 * because it matches by slug and never shows a conflict (Task 75). */
export function useFileManager(): FileManager {
  const hasLeagues = useDatabaseStore((state) => currentRows(state).length > 0);
  const hasBlueprints = useDatabaseStore((state) => state.blueprints.length > 0);
  const { startImport, importConfirm } = useTeamImport();
  const { startFileImport, importDialogs } = useFileImport();

  return {
    hasLeagues,
    hasBlueprints,
    handleExportLeagues: exportAllLeagues,
    handleImportLeagues: () => startFileImport(planLeagueFileImport),
    handleExportBlueprints: exportAllBlueprints,
    handleImportBlueprints: () => startFileImport(planBlueprintFileImport),
    handleImportCsv: () => startImport(readTeamsFromCsv),
    handleExportCsv: exportTeams,
    handleExportDatabase: exportDatabase,
    handleImportDatabase: () => startFileImport(planDatabaseFileImport),
    importConfirm,
    importDialogs,
  };
}
