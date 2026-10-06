import { useMemo } from 'preact/hooks';
import { calculateStandings } from '@/engine/standings';
import { useTeamLookup } from '@/features/components';
import type { LeagueRecord } from '@/features/leagues/types';
import type { Standings, StandingsViewRow } from './types';

/** The league table for one league, ready for `StandingsView` to render.
 * `calculateStandings` is a pure recompute from `league.results` (Task 4),
 * so "live update" needs no state here: a scorinate (Task 15) gives a new
 * `league`, and the rows follow. `useMemo` keeps the recompute to a change
 * of the league or the roster. */
export function useStandings(league: LeagueRecord): Standings {
  const lookupTeam = useTeamLookup();

  const rows = useMemo(
    () =>
      calculateStandings(
        league.teams.map((team) => team.slug),
        league.results,
        league.points
      ).map((row): StandingsViewRow => {
        const { name, colour } = lookupTeam(row.team);
        return { ...row, teamName: name, teamColour: colour };
      }),
    [league, lookupTeam]
  );

  return {
    rows,
    hasTeams: league.teams.length > 0,
    hasResults: league.results.length > 0,
  };
}
