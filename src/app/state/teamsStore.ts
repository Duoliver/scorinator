import { create } from 'zustand';
import type { TeamRecord } from '../../features/components';

/** The one shared, in-memory team roster for the whole app session. Both
 * Team Management and League Setup read and write through this store, so
 * a team created on one screen is visible on the other without a page
 * reload. Holds no disk state — CSV/JSON import and export still go
 * through `features/teams`'s own `csvIO.ts`/`jsonIO.ts` seam, which reads
 * the current roster from here and writes results back here. */
export interface TeamsState {
  teams: TeamRecord[];
  addTeam: (team: TeamRecord) => void;
  updateTeam: (index: number, team: TeamRecord) => void;
  setTeams: (teams: TeamRecord[]) => void;
}

export const useTeamsStore = create<TeamsState>()((set) => ({
  teams: [],
  addTeam: (team): void => set((state) => ({ teams: [...state.teams, team] })),
  updateTeam: (index, team): void =>
    set((state) => {
      const next = [...state.teams];
      next[index] = team;
      return { teams: next };
    }),
  setTeams: (teams): void => set({ teams }),
}));
