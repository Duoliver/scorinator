import { useMemo } from 'preact/hooks';
import { groupLabel } from '@/engine/round-robin';
import { getLastResults } from '@/engine/standings';
import { phaseQualifierMarks, phaseStandings } from '@/app/state/phases';
import { useTeamLookup } from '@/features/components';
import type { LeagueWrapper } from '@/domain';
import { FORM_LENGTH } from './helpers';
import type { FormDot, Standings, StandingsTable, StandingsViewRow } from './types';

/** The tables of one started phase of one league, ready for
 * `StandingsView` to render: one table for a round robin, or one for each
 * group (Task 131). `phaseStandings` is a pure recompute from the phase
 * results (Task 4), with the teams of the phase and the fixed lots of the
 * league (Task 128), and the qualifier mark of each row (Task 132). So
 * "live update" needs no state here: a scorinate
 * (Task 15) gives a new `league`, and the rows follow. `useMemo` keeps the
 * recompute to a change of the league or the phase.
 *
 * `phaseIndex` counts from 0. The current phase (the last started one) is
 * the default. */
export function useStandings(
  league: LeagueWrapper,
  phaseIndex = league.content.phases.length - 1
): Standings {
  const lookupTeam = useTeamLookup(league.teams);
  const phase = league.content.phases[phaseIndex];

  const tables = useMemo((): StandingsTable[] => {
    if (!phase) return [];
    const marks = phaseQualifierMarks(league, phaseIndex);
    const formOf = (team: string): FormDot[] => {
      if (phase.format !== 'round-robin') return [];
      const results = getLastResults(team, phase.fixtures, phase.results, FORM_LENGTH);
      return results.map((result): FormDot => {
        const { name, colour, trigram } = lookupTeam(result.opponent);
        return {
          outcome: result.outcome,
          opponent: trigram || name,
          isTrigram: trigram !== '',
          opponentColour: colour,
          venue: result.isHome ? 'H' : 'A',
          score: `${result.goalsFor}–${result.goalsAgainst}`,
          matchday: result.matchday,
        };
      });
    };
    return phaseStandings(league, phaseIndex).map((table, index) => ({
      name: phase.format === 'groups' ? `Group ${groupLabel(index)}` : 'Standings',
      rows: table.map((row): StandingsViewRow => {
        const { name, colour } = lookupTeam(row.team);
        return {
          ...row,
          teamName: name,
          teamColour: colour,
          mark: marks.get(row.team),
          form: formOf(row.team),
        };
      }),
    }));
  }, [league, phase, phaseIndex, lookupTeam]);

  return {
    isGroups: phase?.format === 'groups',
    tables,
    hasTeams: league.teams.length > 0,
    hasResults: (phase?.results.length ?? 0) > 0,
  };
}
