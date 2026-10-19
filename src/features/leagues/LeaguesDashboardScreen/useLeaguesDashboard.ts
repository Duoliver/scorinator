import { useLeagueStore } from '@/app/state/leagueStore';
import { formatLeagueCount } from './helpers';
import type { LeaguesDashboard } from './types';

export function useLeaguesDashboard(): LeaguesDashboard {
  const leagues = useLeagueStore((state) => state.leagues);
  return {
    leagues,
    hasLeagues: leagues.length > 0,
    subtitle: `${formatLeagueCount(leagues.length)} running`,
  };
}
