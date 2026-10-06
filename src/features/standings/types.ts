import type { StandingsRow } from '@/engine/standings';
import type { LeagueRecord } from '@/features/leagues/types';

export default interface StandingsViewProps {
  league: LeagueRecord;
}

/** One standings row, with the roster name and colour of its team. */
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
