import type { TieCardModel } from '@/features/bracket/BracketView/types';

export default interface TieCardProps {
  card: TieCardModel;
  /** Plays the tie, or opens the re-scorinate confirm (US-04.6). */
  onScorinate: (tieId: string) => void;
}
