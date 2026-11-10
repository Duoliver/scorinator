import type { PhaseZone, ZoneColour } from '@/engine/phases';
import type { MatchOutcome, StandingsRow } from '@/engine/standings';
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

/** One dot of the Form column (US-12.1): the outcome, and the texts of its
 * hint. */
export interface FormDot {
  outcome: MatchOutcome;
  /** The opponent trigram, or its name when it has none (choice 3). */
  opponent: string;
  isTrigram: boolean;
  opponentColour: string;
  venue: 'H' | 'A';
  /** The goals of the team first, for example "2–1". */
  score: string;
  matchday: number;
}

/** One standings row, with the Instance name and colour of its team. */
export interface StandingsViewRow extends StandingsRow<string> {
  teamName: string;
  teamColour: string;
  /** The league trigram, or `''` (Task 157). */
  teamTrigram: string;
  /** The Location of the Blueprint, or `''` (US-09.3). */
  teamLocation: string;
  /** The zone of the row, for its tint and stripe (Task 155), or
   * `undefined`. */
  zone: ZoneColour | undefined;
  /** The last results of the team, the oldest first. Empty in a group card. */
  form: FormDot[];
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
  /** The zones of the legend (US-12.5), in place order: only the zones
   * that colour a row. */
  zones: PhaseZone[];
  hasTeams: boolean;
  hasResults: boolean;
}
