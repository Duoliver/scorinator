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
 * The same `results` list also backs the head-to-head tie-break below —
 * standings needs no state beyond what this call already receives.
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
      sortOrder: 0,
      position: 0,
      positionText: '',
    });
  }

  for (const result of results) {
    applyResult(rows, result, pointsConfig);
  }

  return orderAndPosition([...rows.values()], teams, results, pointsConfig);
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

/**
 * Orders the table and fills in `sortOrder`, `position`, and
 * `positionText`.
 *
 * A group of rows level on points, goal difference, and goals for is
 * resolved by a mini-league: a fresh points/goal-difference/goals-for
 * table, built only from the matches played among that group's own
 * members, per `pointsConfig` — the same method UEFA, La Liga, and Serie A
 * use for a group stage or a league placing. Comparing two teams at a time
 * by raw head-to-head wins does not generalize past two teams: a 3-or-more
 * way head-to-head cycle (A beats B, B beats C, C beats A) has no
 * consistent pairwise order, so a pairwise comparator used inside a sort
 * is not reliable there. The mini-league sidesteps this because its inputs
 * — points, goal difference, goals for, all counted only within the group
 * — are plain numbers, and comparing numbers is always transitive. A group
 * still level after its own mini-league shares one `position`, ordered
 * among themselves by roster order, the tie-break of last resort.
 *
 * This runs one mini-league pass per group, not the fully recursive
 * version a professional competition uses when a mini-league partially
 * — but not fully — separates a group (which then rebuilds a smaller
 * mini-league from only the still-tied remainder). See the Task 4 decision
 * log for what that would take and why this task does not build it.
 */
function orderAndPosition<TeamId>(
  rows: StandingsRow<TeamId>[],
  teams: readonly TeamId[],
  results: readonly MatchResult<TeamId>[],
  pointsConfig: PointsConfig
): StandingsRow<TeamId>[] {
  const byRoster = (a: StandingsRow<TeamId>, b: StandingsRow<TeamId>): number =>
    teams.indexOf(a.team) - teams.indexOf(b.team);

  const ordered: StandingsRow<TeamId>[] = [];
  let sortOrder = 0;

  for (const group of groupBy(rows, compareByMainCriteria, byRoster)) {
    if (group.length === 1) {
      const row = group[0];
      sortOrder += 1;
      row.sortOrder = sortOrder;
      row.position = sortOrder;
      row.positionText = String(sortOrder);
      ordered.push(row);
      continue;
    }

    const miniLeague = computeMiniLeague(
      group.map((row) => row.team),
      results,
      pointsConfig
    );
    const compareByMiniLeague = (a: StandingsRow<TeamId>, b: StandingsRow<TeamId>): number => {
      const miniA = miniLeague.get(a.team);
      const miniB = miniLeague.get(b.team);
      if (!miniA || !miniB) throw new RangeError('mini-league is missing a group member.');
      if (miniB.points !== miniA.points) return miniB.points - miniA.points;
      if (miniB.goalDifference !== miniA.goalDifference) return miniB.goalDifference - miniA.goalDifference;
      return miniB.goalsFor - miniA.goalsFor;
    };

    for (const subGroup of groupBy(group, compareByMiniLeague, byRoster)) {
      const position = sortOrder + 1;
      for (const row of subGroup) {
        sortOrder += 1;
        row.sortOrder = sortOrder;
        row.position = position;
        row.positionText = sortOrder === position ? String(position) : '-';
        ordered.push(row);
      }
    }
  }

  return ordered;
}

// Points desc, then goal difference desc, then goals for desc.
function compareByMainCriteria<TeamId>(a: StandingsRow<TeamId>, b: StandingsRow<TeamId>): number {
  if (b.points !== a.points) return b.points - a.points;
  if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
  return b.goalsFor - a.goalsFor;
}

// Sorts by `compareCriteria`, breaking any remaining tie with `tieBreak`,
// then partitions the result into contiguous runs that `compareCriteria`
// treats as equal. Both comparators passed in here are plain numeric
// comparisons, so they are always transitive, and an adjacent-pair check
// is enough to find a run's true boundaries.
function groupBy<T>(items: T[], compareCriteria: (a: T, b: T) => number, tieBreak: (a: T, b: T) => number): T[][] {
  const sorted = [...items].sort((a, b) => compareCriteria(a, b) || tieBreak(a, b));
  const groups: T[][] = [];
  for (const item of sorted) {
    const currentGroup = groups[groups.length - 1];
    if (currentGroup && compareCriteria(currentGroup[0], item) === 0) {
      currentGroup.push(item);
    } else {
      groups.push([item]);
    }
  }
  return groups;
}

interface MiniLeagueStats {
  points: number;
  goalDifference: number;
  goalsFor: number;
}

// A fresh points/goal-difference/goals-for table, counting only the
// matches played among `groupTeams` themselves.
function computeMiniLeague<TeamId>(
  groupTeams: readonly TeamId[],
  results: readonly MatchResult<TeamId>[],
  pointsConfig: PointsConfig
): Map<TeamId, MiniLeagueStats> {
  const members = new Set(groupTeams);
  const stats = new Map<TeamId, MiniLeagueStats>();
  for (const team of groupTeams) {
    stats.set(team, { points: 0, goalDifference: 0, goalsFor: 0 });
  }

  for (const result of results) {
    if (!members.has(result.home) || !members.has(result.away)) continue;
    const home = stats.get(result.home);
    const away = stats.get(result.away);
    if (!home || !away) continue;

    home.goalsFor += result.homeGoals;
    home.goalDifference += result.homeGoals - result.awayGoals;
    away.goalsFor += result.awayGoals;
    away.goalDifference += result.awayGoals - result.homeGoals;

    if (result.homeGoals > result.awayGoals) {
      home.points += pointsConfig.win;
      away.points += pointsConfig.loss;
    } else if (result.homeGoals < result.awayGoals) {
      away.points += pointsConfig.win;
      home.points += pointsConfig.loss;
    } else {
      home.points += pointsConfig.draw;
      away.points += pointsConfig.draw;
    }
  }

  return stats;
}
