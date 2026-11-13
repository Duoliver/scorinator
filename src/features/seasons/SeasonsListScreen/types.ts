import type { SeasonSummary } from '@/domain';
import type { ConfirmDialogProps } from '@/design-system';
import type { SeasonCard } from './SeasonList';
import type { SeasonDialogProps } from './SeasonDialog';

/** What `useSeasonsList` gives the screen. */
export interface SeasonsList {
  cards: readonly SeasonCard[];
  hasSeasons: boolean;
  subtitle: string;
  search: string;
  setSearch: (search: string) => void;
  noMatchText: string | null;
  openCreate: () => void;
  openRename: (row: SeasonSummary) => void;
  openDelete: (row: SeasonSummary) => void;
  dialog: SeasonDialogProps | null;
  deleteConfirm: ConfirmDialogProps | null;
}
