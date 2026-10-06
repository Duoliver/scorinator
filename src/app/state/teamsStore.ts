import { create } from 'zustand';
import type { TeamRecord } from '@/features/components';

/** The one shared, in-memory team roster for the whole app session. Both
 * Team Management and League Setup read and write through this store, so
 * a team created on one screen is visible on the other without a page
 * reload. Holds no disk state — CSV/JSON import and export go through the
 * sibling `app/data/teamsCsv.ts`/`teamsJson.ts` seam, which reads the
 * current roster from here and writes results back here.
 *
 * State only. The actions that change it live in `teamsActions.ts`. */
export interface TeamsState {
  teams: TeamRecord[];
}

export const useTeamsStore = create<TeamsState>()(() => ({
  teams: [],
}));
