import type { RefObject } from 'preact';
import type { ConfirmDialogProps, FieldHandle, SelectOption } from '@/design-system';

/** What `useFileManager` gives `FileScreen`. */
export interface FileManager {
  hasLeagues: boolean;
  leagueOptions: SelectOption[];
  /** The league the results selector shows first: the first league. */
  defaultLeagueUuid: string;
  resultsSelect: RefObject<FieldHandle<string>>;
  handleImportCsv: () => Promise<void>;
  handleImportJson: () => Promise<void>;
  importConfirm: ConfirmDialogProps | null;
  handleExportTeams: () => Promise<void>;
  handleExportResults: () => Promise<void>;
}
