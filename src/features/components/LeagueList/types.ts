import type { WrapperSummary } from '@/domain';

/** One league card: the manifest row of a league, whether the league has
 * unsaved changes, and the link of its "Open standings". The caller gives
 * the link, so a card works for a standalone league and a Season league
 * (Task 219 choice 6). */
export interface LeagueCard {
  row: WrapperSummary;
  isUnsaved: boolean;
  href: string;
}

export default interface LeagueListProps {
  leagues: readonly LeagueCard[];
}
