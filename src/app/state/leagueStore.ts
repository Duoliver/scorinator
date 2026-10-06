import { create } from 'zustand';
import type { LeagueRecord } from '@/features/leagues/types';

/** Imports the leaf `types` module directly, not the `features/leagues`
 * barrel — the barrel re-exports `LeagueSetupScreen`, which itself imports
 * this store, so importing the barrel here would create a cycle. */
export type {
  LeagueRecord,
  LeagueTeam,
  LeagueResult,
  CreateLeagueInput,
} from '@/features/leagues/types';

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
