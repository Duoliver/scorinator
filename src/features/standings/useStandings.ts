import { useMemo } from 'preact/hooks';
import { calculateStandings } from '@/engine/standings';
import { findCurrentPhase } from '@/app/state/currentPhase';
import { useTeamLookup } from '@/features/components';
import type { LeagueWrapper } from '@/domain';
import type { Standings, StandingsViewRow } from './types';

/** The table of the current phase of one league, ready for `StandingsView`
 * to render. `calculateStandings` is a pure recompute from the phase
 * results (Task 4), so "live update" needs no state here: a scorinate
 * (Task 15) gives a new `league`, and the rows follow. `useMemo` keeps the
 * recompute to a change of the league. */
export function useStandings(league: LeagueWrapper): Standings {
  const lookupTeam = useTeamLookup(league.teams);
  const results = findCurrentPhase(league)?.results;

  const rows = useMemo(
    () =>
      calculateStandings(
        league.teams.map((team) => team.blueprintUuid),
        results ?? [],
        league.content.points
      ).map((row): StandingsViewRow => {
        const { name, colour } = lookupTeam(row.team);
        return { ...row, teamName: name, teamColour: colour };
      }),
    [league, results, lookupTeam]
  );

  return {
    rows,
    hasTeams: league.teams.length > 0,
    hasResults: (results?.length ?? 0) > 0,
  };
}
