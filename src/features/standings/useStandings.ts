import { useMemo } from 'preact/hooks';
import { findCurrentPhase } from '@/app/state/currentPhase';
import { phaseStandings } from '@/app/state/phases';
import { useTeamLookup } from '@/features/components';
import type { LeagueWrapper } from '@/domain';
import type { Standings, StandingsViewRow } from './types';

/** The table of the current phase of one league, ready for `StandingsView`
 * to render. `phaseStandings` is a pure recompute from the phase results
 * (Task 4), with the teams of the phase and the fixed lots of the league
 * (Task 128). So "live update" needs no state here: a scorinate (Task 15)
 * gives a new `league`, and the rows follow. `useMemo` keeps the recompute
 * to a change of the league.
 *
 * A Groups phase shows its first table only, until Task 131 adds the group
 * cards (Task 128 choice 6). */
export function useStandings(league: LeagueWrapper): Standings {
  const lookupTeam = useTeamLookup(league.teams);
  const results = findCurrentPhase(league)?.results;

  const rows = useMemo(() => {
    const index = league.content.phases.length - 1;
    const [table = []] = index < 0 ? [] : phaseStandings(league, index);
    return table.map((row): StandingsViewRow => {
      const { name, colour } = lookupTeam(row.team);
      return { ...row, teamName: name, teamColour: colour };
    });
  }, [league, lookupTeam]);

  return {
    rows,
    hasTeams: league.teams.length > 0,
    hasResults: (results?.length ?? 0) > 0,
  };
}
