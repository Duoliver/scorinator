import type { LeagueRecord } from '@/domain';

/** What `useLeaguesDashboard` gives `LeaguesDashboardScreen`. */
export interface LeaguesDashboard {
  leagues: readonly LeagueRecord[];
  hasLeagues: boolean;
  subtitle: string;
}
