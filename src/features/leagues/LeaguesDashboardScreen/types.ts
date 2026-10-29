import type { LeagueCard } from './LeagueList';

/** What `useLeaguesDashboard` gives `LeaguesDashboardScreen`. */
export interface LeaguesDashboard {
  leagues: readonly LeagueCard[];
  hasLeagues: boolean;
  subtitle: string;
}
