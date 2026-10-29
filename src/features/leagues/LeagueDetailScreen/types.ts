import type { TabItem } from '@/design-system';
import type { LeagueWrapper } from '@/domain';

export default interface LeagueDetailScreenProps {
  uuid: string;
}

/** What `useLeagueDetail` gives `LeagueDetailScreen` for an open league. */
export interface LeagueDetail {
  league: LeagueWrapper;
  meta: string;
  isUnsaved: boolean;
  tabs: TabItem[];
}

/** Where the league of the route stands: read from the database, still
 * reading, not in the database, or in a file that cannot be read. */
export type LeagueDetailState =
  | { kind: 'open'; detail: LeagueDetail }
  | { kind: 'opening' }
  | { kind: 'not-found' }
  | { kind: 'error'; message: string };
