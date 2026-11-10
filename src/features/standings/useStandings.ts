import { useMemo } from 'preact/hooks';
import { groupLabel } from '@/engine/round-robin';
import { getLastResults } from '@/engine/standings';
import { getPhaseZoneView, phaseStandings } from '@/app/state/phases';
import { useTeamLookup } from '@/features/components';
import type { LeagueWrapper } from '@/domain';
import { FORM_LENGTH } from './helpers';
import { type PhaseZone, PhaseFormat } from '@/engine/phases';
import type { FormDot, Standings, StandingsTable, StandingsViewRow } from './types';

/** The tables of one started phase of one league, ready for
 * `StandingsView` to render: one table for a round robin, or one for each
 * group (Task 131). `phaseStandings` is a pure recompute from the phase
 * results (Task 4), with the teams of the phase and the fixed lots of the
 * league (Task 128), and the zone of each row (Task 155). So
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

  const { tables, zones } = useMemo((): {
    tables: StandingsTable[];
    zones: PhaseZone[];
  } => {
    if (!phase) return { tables: [], zones: [] };
    const zoneView = getPhaseZoneView(league, phaseIndex);
    const formOf = (team: string): FormDot[] => {
      if (phase.format !== PhaseFormat.ROUND_ROBIN) return [];
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
    const viewTables = phaseStandings(league, phaseIndex).map((table, index) => ({
      name:
        phase.format === PhaseFormat.GROUPS
          ? `Group ${groupLabel(index)}`
          : 'Standings',
      rows: table.map((row): StandingsViewRow => {
        const { name, colour, trigram, location } = lookupTeam(row.team);
        return {
          ...row,
          teamName: name,
          teamColour: colour,
          teamTrigram: trigram,
          teamLocation: location,
          zone: zoneView.colours.get(row.team),
          form: formOf(row.team),
        };
      }),
    }));
    // A zone with no row, for example the yellow zone of a complete phase,
    // has nothing to explain, so the legend leaves it out.
    const used = new Set(zoneView.colours.values());
    return {
      tables: viewTables,
      zones: zoneView.zones.filter((zone) => used.has(zone.colour)),
    };
  }, [league, phase, phaseIndex, lookupTeam]);

  return {
    isGroups: phase?.format === PhaseFormat.GROUPS,
    tables,
    zones,
    hasTeams: league.teams.length > 0,
    hasResults: (phase?.results.length ?? 0) > 0,
  };
}
