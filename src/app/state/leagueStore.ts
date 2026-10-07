import { create } from 'zustand';
import type { LeagueRecord } from '@/domain';

/** The one shared, in-memory league list for the app session. Fixture
 * generation (Task 14) and full-file save (Task 17) read from this store.
 *
 * State only. The actions that change it live in `leagueActions.ts`. */
export interface LeagueState {
  leagues: LeagueRecord[];
}

export const useLeagueStore = create<LeagueState>()(() => ({
  leagues: [],
}));
