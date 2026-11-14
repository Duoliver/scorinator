import type { FileImportDialogsProps, LeagueCard } from '@/features/components';

/** What `useLeaguesDashboard` gives `LeaguesDashboardScreen`. */
export interface LeaguesDashboard {
  leagues: readonly LeagueCard[];
  hasLeagues: boolean;
  subtitle: string;
  handleImportLeague: () => Promise<void>;
  importDialogs: FileImportDialogsProps | null;
}
