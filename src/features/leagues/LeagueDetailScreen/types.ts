import type { TabItem } from '@/design-system';
import type { LeagueRecord } from '@/domain';

export default interface LeagueDetailScreenProps {
  slug: string;
}

/** What `useLeagueDetail` gives `LeagueDetailScreen` for a league it
 * finds. */
export interface LeagueDetail {
  league: LeagueRecord;
  meta: string;
  isUnsaved: boolean;
  tabs: TabItem[];
}
