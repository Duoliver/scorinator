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

/** The league with this slug, or `undefined`. A slug is unique in the list
 * (`addLeague` rejects a taken one), so the first match is the only one. */
export function findLeague(
  leagues: readonly LeagueRecord[],
  slug: string
): LeagueRecord | undefined {
  return leagues.find((league) => league.slug === slug);
}
