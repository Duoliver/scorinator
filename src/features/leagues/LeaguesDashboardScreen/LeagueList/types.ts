import type { WrapperSummary } from '@/domain';

/** One dashboard card: the manifest row of a league, and whether the league
 * has unsaved changes. */
export interface LeagueCard {
  row: WrapperSummary;
  isUnsaved: boolean;
}

export default interface LeagueListProps {
  leagues: readonly LeagueCard[];
}
