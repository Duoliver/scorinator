import type { StandingsRow } from '@/engine/standings';
import type { QualifierMark } from '@/app/state/phases';
import type { LeagueWrapper } from '@/domain';

export default interface StandingsViewProps {
  league: LeagueWrapper;
  /** The started phase to show, from 0. The current phase when not given. */
  phaseIndex?: number;
  /** The line under the tables of a phase that sends teams on, for example
   * "Top 2 of each group advance to the Bracket." (Tasks 131, 132). League
   * Detail makes it from the plans, so this folder needs no phase text of
   * its own. */
  advanceText?: string;
}

/** One standings row, with the Instance name and colour of its team. */
export interface StandingsViewRow extends StandingsRow<string> {
  teamName: string;
  teamColour: string;
  /** How the row qualifies, for its tint (Task 132), or `undefined`. */
  mark: QualifierMark | undefined;
}

/** One table of a phase: the one table of a round robin, or one group
 * card of a Groups phase, with its name ("Group A"). */
export interface StandingsTable {
  name: string;
  rows: StandingsViewRow[];
}

/** What `useStandings` gives `StandingsView`. */
export interface Standings {
  /** True for a Groups phase: the tables show as group cards. */
  isGroups: boolean;
  tables: StandingsTable[];
  hasTeams: boolean;
  hasResults: boolean;
}
