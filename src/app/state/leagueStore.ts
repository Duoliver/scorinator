import { create } from 'zustand';
import { createSeededRng } from '@/engine/rng';
import { rollOVR } from '@/engine/tier-ovr';
import { slug } from '@/engine/identity';
import { generateRoundRobin } from '@/engine/fixtures';
import type { CreateLeagueInput, LeagueRecord } from '@/features/leagues/types';

/** Imports the leaf `types` module directly, not the `features/leagues`
 * barrel — the barrel re-exports `LeagueSetupScreen`, which itself imports
 * this store, so importing the barrel here would create a cycle. */
export type {
  LeagueRecord,
  LeagueTeam,
  CreateLeagueInput,
} from '@/features/leagues/types';

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
 * store later; neither happens here.
 *
 * `addLeague` also rolls the league's `slug`, from its name, the same
 * `engine/identity` `slug()` call `TeamForm` already makes. `slug()`
 * throws a `RangeError` for a degenerate name (blank, or symbols-only) —
 * the caller guards this, the same way `TeamForm.handleSave` does for a
 * team name. See `LeagueSetupScreen.handleCreate`.
 *
 * `addLeague` also generates the league's two-way round-robin schedule
 * (Task 14), from the just-rolled teams' slugs. `generateRoundRobin`
 * throws for fewer than 2 teams (a deliberate Task 3 choice), but nothing
 * stops a user from creating a league with 0 or 1 team today, so this
 * guards the call instead of letting league creation crash — a league
 * with too few teams simply gets an empty schedule. See the Task 14
 * decisions log entry. */
export const useLeagueStore = create<LeagueState>()((set) => ({
  leagues: [],
  addLeague: (input): LeagueRecord => {
    const rng = createSeededRng(freshSeed());
    const teams = input.teams.map((team) => ({
      slug: team.slug,
      ovr: rollOVR(team.tier, rng),
    }));
    const slugs = teams.map((team) => team.slug);
    const { fixtures, byes } =
      slugs.length >= 2 ? generateRoundRobin(slugs) : { fixtures: [], byes: [] };
    const league: LeagueRecord = {
      slug: slug(input.name),
      name: input.name,
      homeAdvantage: input.homeAdvantage,
      points: input.points,
      teams,
      fixtures,
      byes,
    };
    set((state) => ({ leagues: [...state.leagues, league] }));
    return league;
  },
}));
