import { create } from 'zustand';
import type { TeamRecord } from '@/features/components';

/** The one shared, in-memory team roster for the whole app session. Both
 * Team Management and League Setup read and write through this store, so
 * a team created on one screen is visible on the other without a page
 * reload. Holds no disk state: a file import or export is an app action,
 * which reads the roster here and writes imported teams back with
 * `setTeams`.
 *
 * State only. The actions that change it live in `teamsActions.ts`. */
export interface TeamsState {
  teams: TeamRecord[];
}

export const useTeamsStore = create<TeamsState>()(() => ({
  teams: [],
}));
