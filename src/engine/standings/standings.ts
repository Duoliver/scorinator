import type { MatchResult, PointsConfig, StandingsRow } from './types';

/** MVP1 spec §1 "Standings": win/draw/loss defaults to 3/1/0. */
export const DEFAULT_POINTS_CONFIG: Readonly<PointsConfig> = { win: 3, draw: 1, loss: 0 };

/**
 * Computes a standings table from a roster and a set of played results.
 *
 * This is a pure recompute, not a running total: call it again with the
 * current result set whenever a match is scorinated or re-scorinated, and
 * the table reflects that snapshot. That is what "live update" (MVP1 spec)
 * and re-scorinate's "just overwrite + recalc" (Task 7) come down to at
 * this layer — there is no standings-side state to keep in sync by hand.
 */
export function calculateStandings<TeamId>(
  teams: readonly TeamId[],
  results: readonly MatchResult<TeamId>[],
  pointsConfig: PointsConfig = DEFAULT_POINTS_CONFIG
): StandingsRow<TeamId>[] {
  const rows = new Map<TeamId, StandingsRow<TeamId>>();
  for (const team of teams) {
    rows.set(team, {
      team,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0,
    });
  }

  for (const result of results) {
    applyResult(rows, result, pointsConfig);
  }

  return [...rows.values()].sort((a, b) => compareRows(a, b, teams));
}

function applyResult<TeamId>(
  rows: Map<TeamId, StandingsRow<TeamId>>,
  result: MatchResult<TeamId>,
  pointsConfig: PointsConfig
): void {
  const home = rows.get(result.home);
  const away = rows.get(result.away);
  if (!home) {
    throw new RangeError(`calculateStandings got a result for a team not in the roster: ${String(result.home)}.`);
  }
  if (!away) {
    throw new RangeError(`calculateStandings got a result for a team not in the roster: ${String(result.away)}.`);
  }

  home.played++;
  away.played++;
  home.goalsFor += result.homeGoals;
  home.goalsAgainst += result.awayGoals;
  away.goalsFor += result.awayGoals;
  away.goalsAgainst += result.homeGoals;
  home.goalDifference = home.goalsFor - home.goalsAgainst;
  away.goalDifference = away.goalsFor - away.goalsAgainst;

  if (result.homeGoals > result.awayGoals) {
    home.won++;
    home.points += pointsConfig.win;
    away.lost++;
    away.points += pointsConfig.loss;
  } else if (result.homeGoals < result.awayGoals) {
    away.won++;
    away.points += pointsConfig.win;
    home.lost++;
    home.points += pointsConfig.loss;
  } else {
    home.drawn++;
    home.points += pointsConfig.draw;
    away.drawn++;
    away.points += pointsConfig.draw;
  }
}

// Points desc, then goal difference desc, then goals for desc, then the
// team's position in the input roster — deterministic, no RNG involved.
function compareRows<TeamId>(
  a: StandingsRow<TeamId>,
  b: StandingsRow<TeamId>,
  teams: readonly TeamId[]
): number {
  if (b.points !== a.points) return b.points - a.points;
  if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
  if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
  return teams.indexOf(a.team) - teams.indexOf(b.team);
}
