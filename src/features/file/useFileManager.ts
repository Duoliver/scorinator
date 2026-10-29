import { useMemo, useRef } from 'preact/hooks';
import type { FieldHandle } from '@/design-system';
import { exportResults, exportTeams } from '@/app/exportActions';
import { importTeamsFromCsv, importTeamsFromJson } from '@/app/loadActions';
import { currentRows, useDatabaseStore } from '@/app/state/databaseStore';
import { toLeagueOptions } from './helpers';
import type { FileManager } from './types';

/** The File screen (Task 17): import and export team lists, and export
 * results (Task 18). A league saves into the database with Ctrl+S, so the
 * screen has no league save or load until Task 149 (Task 161). Every action
 * reports through `fileStore`'s status line. The selector is uncontrolled,
 * so the export reads the picked league from its ref, or else uses the
 * first league. */
export function useFileManager(): FileManager {
  const rows = useDatabaseStore((state) => state.rows);
  const leagues = useDatabaseStore((state) => state.leagues);
  const leagueRows = useMemo(() => currentRows({ rows, leagues }), [rows, leagues]);

  const resultsSelect = useRef<FieldHandle<string>>(null);
  const defaultLeagueUuid = leagueRows[0]?.uuid ?? '';

  return {
    hasLeagues: leagueRows.length > 0,
    leagueOptions: toLeagueOptions(leagueRows),
    defaultLeagueUuid,
    resultsSelect,
    handleImportCsv: importTeamsFromCsv,
    handleImportJson: importTeamsFromJson,
    handleExportTeams: exportTeams,
    handleExportResults: () =>
      exportResults(resultsSelect.current?.getValue() || defaultLeagueUuid),
  };
}
