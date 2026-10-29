import type { StandingsRow } from '@/engine/standings';
import type { LeagueWrapper } from '@/domain';

export default interface StandingsViewProps {
  league: LeagueWrapper;
}

/** One standings row, with the Instance name and colour of its team. */
export interface StandingsViewRow extends StandingsRow<string> {
  teamName: string;
  teamColour: string;
}

/** What `useStandings` gives `StandingsView`. */
export interface Standings {
  rows: StandingsViewRow[];
  hasTeams: boolean;
  hasResults: boolean;
}
