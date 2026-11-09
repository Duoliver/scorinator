import type { ConfirmDialogProps } from '@/design-system';
import type { FileImportDialogsProps } from '@/features/components';

/** What `useFileManager` gives `FileScreen`. */
export interface FileManager {
  hasLeagues: boolean;
  hasBlueprints: boolean;
  handleExportLeagues: () => Promise<void>;
  handleImportLeagues: () => Promise<void>;
  handleExportBlueprints: () => Promise<void>;
  handleImportBlueprints: () => Promise<void>;
  handleImportCsv: () => Promise<void>;
  handleExportCsv: () => Promise<void>;
  handleExportDatabase: () => Promise<void>;
  handleImportDatabase: () => Promise<void>;
  /** The CSV import confirm (Task 75). */
  importConfirm: ConfirmDialogProps | null;
  importDialogs: FileImportDialogsProps | null;
}
