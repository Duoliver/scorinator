import type { FileImportDialogsProps } from '@/features/components';
import type { LeagueCard } from './LeagueList';

/** What `useLeaguesDashboard` gives `LeaguesDashboardScreen`. */
export interface LeaguesDashboard {
  leagues: readonly LeagueCard[];
  hasLeagues: boolean;
  subtitle: string;
  handleImportLeague: () => Promise<void>;
  importDialogs: FileImportDialogsProps | null;
}
