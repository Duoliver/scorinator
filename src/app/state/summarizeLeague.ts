import { bracketSlotCount, findCurrentRound } from '@/engine/bracket';
import { findPhaseCurrentMatchday } from '@/engine/round-robin';
import type {
  BracketPhase,
  LeagueProgress,
  LeagueWrapper,
  WrapperSummary,
} from '@/domain';
import { bracketTreeOf } from './bracket';
import { findCurrentPhase } from './currentPhase';
import { PhaseFormat } from '@/engine/phases';

/** Where a league stands, in its current phase (`findCurrentPhase`). Between
 * the end of a phase and the next start, the progress stays on the last
 * matchday of the complete phase, for example MD 6/6 (US-07.3). The league
 * is completed when the last planned phase is complete, or when it has no
 * phase or no fixture. A bracket shows its current round. */
function progressOf(wrapper: LeagueWrapper): LeagueProgress {
  const current = findCurrentPhase(wrapper);
  if (!current) return { kind: 'completed' };
  const { phases, plans } = wrapper.content;
  const index = phases.indexOf(current);
  const isLast = phases.length >= plans.length;
  if (current.format === PhaseFormat.BRACKET) {
    return bracketProgressOf(wrapper, current, index, isLast);
  }
  if (current.fixtures.length === 0) return { kind: 'completed' };

  const matchdays = Math.max(...current.fixtures.map((fixture) => fixture.matchday));
  const matchday = findPhaseCurrentMatchday(current.fixtures, current.results);
  if (matchday === undefined && isLast) return { kind: 'completed' };
  return {
    kind: 'phase',
    phase: index + 1,
    matchday: matchday ?? matchdays,
    matchdays,
  };
}

/** The bracket progress (Task 139 choice 6): the slot count of the earliest
 * round with a tie and no result. With missing byes, the first round. A
 * complete bracket as the last phase is completed. */
function bracketProgressOf(
  wrapper: LeagueWrapper,
  current: BracketPhase,
  index: number,
  isLast: boolean
): LeagueProgress {
  const phase = index + 1;
  const tree = bracketTreeOf(wrapper, index);
  if (tree.status !== 'ready') {
    return {
      kind: PhaseFormat.BRACKET,
      phase,
      round: bracketSlotCount(current.seeds.length),
    };
  }
  const round = findCurrentRound(tree.rounds, current.results);
  if (round !== undefined) {
    return { kind: PhaseFormat.BRACKET, phase, round: tree.rounds[round - 1].teams };
  }
  const last = tree.rounds[tree.rounds.length - 1];
  return isLast
    ? { kind: 'completed' }
    : { kind: PhaseFormat.BRACKET, phase, round: last.teams };
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
      plan.format === PhaseFormat.BRACKET
        ? { format: PhaseFormat.BRACKET }
        : { format: plan.format, legs: plan.legs }
    ),
    progress: progressOf(wrapper),
  };
}
