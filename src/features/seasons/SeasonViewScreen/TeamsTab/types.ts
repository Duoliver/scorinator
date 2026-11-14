import type { TeamInstance } from '@/domain';

/** One row of the Season roster: the Season team, the Location of its
 * Blueprint, and the names of the leagues that it plays in. */
export interface RosterRow {
  team: TeamInstance;
  location: string;
  leagueNames: readonly string[];
}

/** The Teams tab of the Season view (US-13.4, Task 213). */
export default interface TeamsTabProps {
  rows: readonly RosterRow[];
  isFinished: boolean;
  onEdit: (blueprintUuid: string) => void;
}
