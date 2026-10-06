import type { LeagueRecord } from '@/features/leagues/types';

export default interface LeagueListProps {
  leagues: readonly LeagueRecord[];
}
