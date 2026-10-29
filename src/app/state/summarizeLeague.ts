import { findPhaseCurrentMatchday } from '@/engine/round-robin';
import type { LeagueProgress, LeagueWrapper, WrapperSummary } from '@/domain';
import { findCurrentPhase } from './currentPhase';

/** Where a league stands, in its current phase (`findCurrentPhase`). A
 * phase with no unplayed fixture, or no phase at all, counts as completed. */
function progressOf(wrapper: LeagueWrapper): LeagueProgress {
  const current = findCurrentPhase(wrapper);
  if (!current) return { kind: 'completed' };

  const matchday = findPhaseCurrentMatchday(current.fixtures, current.results);
  if (matchday === undefined) return { kind: 'completed' };

  const matchdays = Math.max(...current.fixtures.map((fixture) => fixture.matchday));
  return {
    kind: 'phase',
    phase: wrapper.content.phases.indexOf(current) + 1,
    matchday,
    matchdays,
  };
}

/** The manifest row of one league, for its dashboard card (Task 76 d). The
 * one place that builds a row: nothing sets a row by hand. */
export function summarizeLeague(wrapper: LeagueWrapper): WrapperSummary {
  const league = wrapper.content;
  return {
    uuid: wrapper.uuid,
    contentType: 'league',
    name: league.name,
    teamCount: wrapper.teams.length,
    homeAdvantage: league.homeAdvantage,
    points: { ...league.points },
    phaseFormats: league.phases.map((phase) => phase.format),
    progress: progressOf(wrapper),
  };
}
