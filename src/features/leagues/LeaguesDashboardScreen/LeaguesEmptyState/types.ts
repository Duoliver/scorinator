import type { ConfirmDialogProps } from '@/design-system';
import type { FileImportDialogsProps } from '@/features/components';

/** What `useLeaguesEmptyState` gives `LeaguesEmptyState`. */
export interface LeaguesEmptyStateHandlers {
  handleLoadTeams: () => Promise<void>;
  handleImportLeague: () => Promise<void>;
  importConfirm: ConfirmDialogProps | null;
  importDialogs: FileImportDialogsProps | null;
}
