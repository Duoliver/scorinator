import type { SeasonSummary } from '@/domain';

/** One Season card: its manifest row, and whether it has unsaved changes. */
export interface SeasonCard {
  row: SeasonSummary;
  isUnsaved: boolean;
}

export default interface SeasonListProps {
  cards: readonly SeasonCard[];
  onRename: (row: SeasonSummary) => void;
  onDelete: (row: SeasonSummary) => void;
}
