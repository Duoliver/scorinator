import { create } from 'zustand';
import { createSeededRng } from '../../engine/rng';
import { rollOVR } from '../../engine/tier-ovr';
import type {
  CreateLeagueInput,
  LeagueRecord,
} from '../../features/leagues/types';

/** Imports the leaf `types` module directly, not the `features/leagues`
 * barrel — the barrel re-exports `LeagueSetupScreen`, which itself imports
 * this store, so importing the barrel here would create a cycle. */
export type { LeagueRecord, LeagueTeam, CreateLeagueInput } from '../../features/leagues/types';

export interface LeagueState {
  leagues: LeagueRecord[];
  addLeague: (input: CreateLeagueInput) => LeagueRecord;
}

/** Matches the seeding already used at `App.tsx`'s scorinator playground:
 * a fresh, non-deterministic seed per call, fed into the deterministic
 * `Rng` every stochastic `engine/` function requires. */
function freshSeed(): number {
  return Math.floor(Math.random() * 0xffffffff);
}

/** The one shared, in-memory league list for the app session. MVP1 has no
 * Season entity yet, so the league itself stands in for the "start of
 * season" OVR-rolling moment the spec describes — `addLeague` rolls each
 * selected team's OVR once, from its Tier, when the league is created.
 * Fixture generation (Task 14) and full-file save (Task 17) read from this
 * store later; neither happens here. */
export const useLeagueStore = create<LeagueState>()((set) => ({
  leagues: [],
  addLeague: (input): LeagueRecord => {
    const rng = createSeededRng(freshSeed());
    const league: LeagueRecord = {
      name: input.name,
      homeAdvantage: input.homeAdvantage,
      points: input.points,
      teams: input.teams.map((team) => ({
        slug: team.slug,
        ovr: rollOVR(team.tier, rng),
      })),
    };
    set((state) => ({ leagues: [...state.leagues, league] }));
    return league;
  },
}));
