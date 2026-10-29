/** What `useLeaguesEmptyState` gives `LeaguesEmptyState`. */
export interface LeaguesEmptyStateHandlers {
  handleLoadTeams: () => Promise<void>;
}
