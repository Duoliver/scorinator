import type { LeagueRecord } from '@/domain';

export default interface LeagueListProps {
  leagues: readonly LeagueRecord[];
}
