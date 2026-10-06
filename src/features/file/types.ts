import type { RefObject } from 'preact';
import type { SelectOption } from '@/design-system';
import type { FieldHandle } from '@/design-system/field';

/** What `useLeagueLoad` gives: the load, and the confirm step it shows when
 * a league with the same slug is already open. */
export interface LeagueLoad {
  /** The name of the loaded league that waits for Replace or Cancel, or
   * `null` when no confirm step shows. */
  pendingLeagueName: string | null;
  handleLoad: () => Promise<void>;
  confirmReplace: () => void;
  cancelReplace: () => void;
}

/** What `useFileManager` gives `FileScreen`. */
export interface FileManager extends LeagueLoad {
  hasLeagues: boolean;
  leagueOptions: SelectOption[];
  /** The league each selector shows first: the current league, or else the
   * first one. */
  defaultLeagueSlug: string;
  leagueSelect: RefObject<FieldHandle<string>>;
  resultsSelect: RefObject<FieldHandle<string>>;
  handleSave: () => void;
  handleSaveAs: () => void;
  handleImportCsv: () => Promise<void>;
  handleImportJson: () => Promise<void>;
  handleExportTeams: () => Promise<void>;
  handleExportResults: () => Promise<void>;
}
