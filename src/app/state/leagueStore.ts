import { create } from 'zustand';
import { createSeededRng } from '@/engine/rng';
import { rollOVR } from '@/engine/tier-ovr';
import { slug } from '@/engine/identity';
import { generateRoundRobin, type Fixture } from '@/engine/fixtures';
import { applyHomeAdvantage, scorinateMatch } from '@/engine/scorination';
import type { CreateLeagueInput, LeagueRecord } from '@/features/leagues/types';

/** Imports the leaf `types` module directly, not the `features/leagues`
 * barrel — the barrel re-exports `LeagueSetupScreen`, which itself imports
 * this store, so importing the barrel here would create a cycle. */
export type {
  LeagueRecord,
  LeagueTeam,
  LeagueResult,
  CreateLeagueInput,
} from '@/features/leagues/types';

export interface LeagueState {
  leagues: LeagueRecord[];
  addLeague: (input: CreateLeagueInput) => LeagueRecord;
  scorinateFixture: (leagueSlug: string, fixture: Fixture<string>) => void;
  scorinateMatchday: (leagueSlug: string, matchday: number) => void;
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
 * decisions log entry.
 *
 * `scorinateFixture` and `scorinateMatchday` (Task 15) play one match, or
 * every unplayed match of one matchday. Both skip a fixture that already
 * has a result, rather than overwrite it — re-scorinate is Task 7 (engine)
 * plus Task 19 (UI), confirmed out of scope here, see the Task 15
 * decisions log entry. */
export const useLeagueStore = create<LeagueState>()((set, get) => ({
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
      results: [],
    };
    set((state) => ({ leagues: [...state.leagues, league] }));
    return league;
  },
  scorinateFixture: (leagueSlug, fixture): void => {
    set((state) => ({
      leagues: state.leagues.map((league) => {
        if (league.slug !== leagueSlug) return league;
        const alreadyPlayed = league.results.some(
          (result) =>
            result.matchday === fixture.matchday &&
            result.home === fixture.home &&
            result.away === fixture.away
        );
        const homeTeam = league.teams.find((team) => team.slug === fixture.home);
        const awayTeam = league.teams.find((team) => team.slug === fixture.away);
        if (alreadyPlayed || !homeTeam || !awayTeam) return league;

        const rng = createSeededRng(freshSeed());
        const homeOvr = league.homeAdvantage
          ? applyHomeAdvantage(homeTeam.ovr)
          : homeTeam.ovr;
        const { homeGoals, awayGoals } = scorinateMatch(homeOvr, awayTeam.ovr, rng);
        return {
          ...league,
          results: [
            ...league.results,
            { matchday: fixture.matchday, home: fixture.home, away: fixture.away, homeGoals, awayGoals },
          ],
        };
      }),
    }));
  },
  scorinateMatchday: (leagueSlug, matchday): void => {
    const league = get().leagues.find((candidate) => candidate.slug === leagueSlug);
    if (!league) return;
    const unplayed = league.fixtures.filter(
      (fixture) =>
        fixture.matchday === matchday &&
        !league.results.some(
          (result) =>
            result.matchday === fixture.matchday &&
            result.home === fixture.home &&
            result.away === fixture.away
        )
    );
    for (const fixture of unplayed) {
      get().scorinateFixture(leagueSlug, fixture);
    }
  },
}));
