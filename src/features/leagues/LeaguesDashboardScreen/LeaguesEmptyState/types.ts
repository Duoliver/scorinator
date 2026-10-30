import type { ConfirmDialogProps } from '@/design-system';

/** What `useLeaguesEmptyState` gives `LeaguesEmptyState`. */
export interface LeaguesEmptyStateHandlers {
  handleLoadTeams: () => Promise<void>;
  importConfirm: ConfirmDialogProps | null;
}
