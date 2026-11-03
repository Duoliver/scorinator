import { findPhaseCurrentMatchday } from '@/engine/round-robin';
import type { LeagueProgress, LeagueWrapper, WrapperSummary } from '@/domain';
import { findCurrentPhase } from './currentPhase';

/** Where a league stands, in its current phase (`findCurrentPhase`). Between
 * the end of a phase and the next start, the progress stays on the last
 * matchday of the complete phase, for example MD 6/6 (US-07.3). The league
 * is completed when the last planned phase is complete, or when it has no
 * phase or no fixture. */
function progressOf(wrapper: LeagueWrapper): LeagueProgress {
  const current = findCurrentPhase(wrapper);
  if (!current || current.fixtures.length === 0) return { kind: 'completed' };

  const { phases, plans } = wrapper.content;
  const matchdays = Math.max(...current.fixtures.map((fixture) => fixture.matchday));
  const matchday = findPhaseCurrentMatchday(current.fixtures, current.results);
  if (matchday === undefined && phases.length >= plans.length) {
    return { kind: 'completed' };
  }
  return {
    kind: 'phase',
    phase: phases.indexOf(current) + 1,
    matchday: matchday ?? matchdays,
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
    phases: league.plans.map((plan) =>
      plan.format === 'bracket'
        ? { format: 'bracket' }
        : { format: plan.format, legs: plan.legs }
    ),
    progress: progressOf(wrapper),
  };
}
