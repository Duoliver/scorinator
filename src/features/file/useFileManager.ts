import { useRef } from 'preact/hooks';
import type { FieldHandle } from '@/design-system/field';
import { importTeamsCsv } from '@/app/data/teamsCsv';
import { importTeamsJson } from '@/app/data/teamsJson';
import { exportResultsBySlug, exportTeams } from '@/app/exportActions';
import { importTeams } from '@/app/loadActions';
import { saveLeagueBySlug } from '@/app/saveActions';
import { useFileStore } from '@/app/state/fileStore';
import { useLeagueStore } from '@/app/state/leagueStore';
import { pickDefaultLeagueSlug, toLeagueOptions } from './helpers';
import type { FileManager } from './types';
import { useLeagueLoad } from './useLeagueLoad';

/** The File screen (Task 17): save and load a league, import and export
 * team lists, and export results (Task 18). Every action reports through
 * `fileStore`'s status line, the same one Ctrl+S uses. The selectors are
 * uncontrolled, so each handler reads the picked league from its ref, or
 * else uses the default league. */
export function useFileManager(): FileManager {
  const leagues = useLeagueStore((state) => state.leagues);
  const currentLeagueSlug = useFileStore((state) => state.currentLeagueSlug);
  const status = useFileStore((state) => state.status);
  const leagueLoad = useLeagueLoad();

  const leagueSelect = useRef<FieldHandle<string>>(null);
  const resultsSelect = useRef<FieldHandle<string>>(null);
  const defaultLeagueSlug = pickDefaultLeagueSlug(leagues, currentLeagueSlug);

  const pickedLeague = (select: typeof leagueSelect): string =>
    select.current?.getValue() || defaultLeagueSlug;

  return {
    ...leagueLoad,
    status,
    hasLeagues: leagues.length > 0,
    leagueOptions: toLeagueOptions(leagues),
    defaultLeagueSlug,
    leagueSelect,
    resultsSelect,
    handleSave: (): void => void saveLeagueBySlug(pickedLeague(leagueSelect)),
    handleSaveAs: (): void =>
      void saveLeagueBySlug(pickedLeague(leagueSelect), { saveAs: true }),
    handleImportCsv: () => importTeams(() => importTeamsCsv()),
    handleImportJson: () => importTeams(() => importTeamsJson()),
    handleExportTeams: exportTeams,
    handleExportResults: () => exportResultsBySlug(pickedLeague(resultsSelect)),
  };
}
