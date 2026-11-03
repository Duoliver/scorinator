import type { LotOf, MatchResult, PointsConfig, StandingsRow } from './types';

/** MVP1 spec §1 "Standings": win/draw/loss defaults to 3/1/0. */
export const DEFAULT_POINTS_CONFIG: Readonly<PointsConfig> = {
  win: 3,
  draw: 1,
  loss: 0,
};

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
 *
 * `lotOf` gives the fixed lot of each team (Task 78 rule 1, `fixedLot` in
 * `engine/identity`): the last resort inside a tied block, lower first.
 * Two equal lots, or no `lotOf` at all, fall back to the roster order, the
 * MVP1 rule.
 */
export function calculateStandings<TeamId>(
  teams: readonly TeamId[],
  results: readonly MatchResult<TeamId>[],
  pointsConfig: PointsConfig = DEFAULT_POINTS_CONFIG,
  lotOf?: LotOf<TeamId>
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

  return orderAndPosition(
    [...rows.values()],
    results,
    pointsConfig,
    lastResortOrder(teams, lotOf)
  );
}

// The order inside a block level on every football criterion: the lot,
// lower first, then the roster order. Never 0 for two roster teams, so the
// `sortOrder` is always unique.
function lastResortOrder<TeamId>(
  teams: readonly TeamId[],
  lotOf: LotOf<TeamId> | undefined
): (a: StandingsRow<TeamId>, b: StandingsRow<TeamId>) => number {
  const rosterIndex = new Map<TeamId, number>();
  teams.forEach((team, i) => {
    if (!rosterIndex.has(team)) rosterIndex.set(team, i);
  });
  const byRoster = (a: StandingsRow<TeamId>, b: StandingsRow<TeamId>): number =>
    (rosterIndex.get(a.team) ?? 0) - (rosterIndex.get(b.team) ?? 0);
  if (!lotOf) return byRoster;
  return (a, b) => compareNumbers(lotOf(a.team), lotOf(b.team)) || byRoster(a, b);
}

function compareNumbers(a: number, b: number): number {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

function applyResult<TeamId>(
  rows: Map<TeamId, StandingsRow<TeamId>>,
  result: MatchResult<TeamId>,
  pointsConfig: PointsConfig
): void {
  const home = rows.get(result.home);
  const away = rows.get(result.away);
  if (!home) {
    throw new RangeError(
      `calculateStandings got a result for a team not in the roster: ${String(result.home)}.`
    );
  }
  if (!away) {
    throw new RangeError(
      `calculateStandings got a result for a team not in the roster: ${String(result.away)}.`
    );
  }

  addMatch(home, result.homeGoals, result.awayGoals, pointsConfig);
  addMatch(away, result.awayGoals, result.homeGoals, pointsConfig);
}

// Adds one match to one team's row, seen from that team's side.
function addMatch<TeamId>(
  row: StandingsRow<TeamId>,
  goalsFor: number,
  goalsAgainst: number,
  pointsConfig: PointsConfig
): void {
  row.played++;
  row.goalsFor += goalsFor;
  row.goalsAgainst += goalsAgainst;
  row.goalDifference = row.goalsFor - row.goalsAgainst;
  if (goalsFor > goalsAgainst) row.won++;
  else if (goalsFor < goalsAgainst) row.lost++;
  else row.drawn++;
  row.points += getPoints(goalsFor, goalsAgainst, pointsConfig);
}

// The points one team gets for one match. The main table and the
// mini-league both count points with this function.
function getPoints(
  goalsFor: number,
  goalsAgainst: number,
  pointsConfig: PointsConfig
): number {
  if (goalsFor > goalsAgainst) return pointsConfig.win;
  if (goalsFor < goalsAgainst) return pointsConfig.loss;
  return pointsConfig.draw;
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
 * — are plain numbers, and comparing numbers is always transitive.
 *
 * The mini-league is recursive (Task 78 rule 2, the UEFA method): when it
 * separates only some of the group, a new mini-league runs among each
 * block that is still level, until a pass separates nothing. A block still
 * level after that shares one `position`, ordered among themselves by
 * `lastResort`: the fixed lot, then the roster order.
 */
function orderAndPosition<TeamId>(
  rows: StandingsRow<TeamId>[],
  results: readonly MatchResult<TeamId>[],
  pointsConfig: PointsConfig,
  lastResort: (a: StandingsRow<TeamId>, b: StandingsRow<TeamId>) => number
): StandingsRow<TeamId>[] {
  const ordered: StandingsRow<TeamId>[] = [];

  for (const group of groupBy(rows, compareByMainCriteria, lastResort)) {
    for (const block of splitByMiniLeague(group, results, pointsConfig, lastResort)) {
      const position = ordered.length + 1;
      for (const row of block) {
        row.sortOrder = ordered.length + 1;
        row.position = position;
        row.positionText = row.sortOrder === position ? String(position) : '-';
        ordered.push(row);
      }
    }
  }

  return ordered;
}

// Splits a group level on the main criteria into ordered blocks. Each block
// is level on every criterion, the recursive mini-leagues included. Each
// call works on a smaller group, so the recursion ends.
function splitByMiniLeague<TeamId>(
  group: StandingsRow<TeamId>[],
  results: readonly MatchResult<TeamId>[],
  pointsConfig: PointsConfig,
  lastResort: (a: StandingsRow<TeamId>, b: StandingsRow<TeamId>) => number
): StandingsRow<TeamId>[][] {
  if (group.length === 1) return [group];

  const miniLeague = computeMiniLeague(
    group.map((row) => row.team),
    results,
    pointsConfig
  );
  const compareByMiniLeague = (
    a: StandingsRow<TeamId>,
    b: StandingsRow<TeamId>
  ): number => {
    const miniA = miniLeague.get(a.team);
    const miniB = miniLeague.get(b.team);
    if (!miniA || !miniB)
      throw new RangeError('mini-league is missing a group member.');
    return compareByMainCriteria(miniA, miniB);
  };

  const subGroups = groupBy(group, compareByMiniLeague, lastResort);
  if (subGroups.length === 1) return subGroups;
  return subGroups.flatMap((subGroup) =>
    splitByMiniLeague(subGroup, results, pointsConfig, lastResort)
  );
}

// The numbers both the main table and a mini-league rank by.
interface RankStats {
  points: number;
  goalDifference: number;
  goalsFor: number;
}

// Points desc, then goal difference desc, then goals for desc. Takes a
// standings row or a mini-league entry.
function compareByMainCriteria(a: RankStats, b: RankStats): number {
  if (b.points !== a.points) return b.points - a.points;
  if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
  return b.goalsFor - a.goalsFor;
}

// Sorts by `compareCriteria`, breaking any remaining tie with `tieBreak`,
// then partitions the result into contiguous runs that `compareCriteria`
// treats as equal. Both comparators passed in here are plain numeric
// comparisons, so they are always transitive, and an adjacent-pair check
// is enough to find a run's true boundaries.
function groupBy<T>(
  items: T[],
  compareCriteria: (a: T, b: T) => number,
  tieBreak: (a: T, b: T) => number
): T[][] {
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

// A fresh points/goal-difference/goals-for table, counting only the
// matches played among `groupTeams` themselves.
function computeMiniLeague<TeamId>(
  groupTeams: readonly TeamId[],
  results: readonly MatchResult<TeamId>[],
  pointsConfig: PointsConfig
): Map<TeamId, RankStats> {
  const members = new Set(groupTeams);
  const stats = new Map<TeamId, RankStats>();
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
    home.points += getPoints(result.homeGoals, result.awayGoals, pointsConfig);
    away.goalsFor += result.awayGoals;
    away.goalDifference += result.awayGoals - result.homeGoals;
    away.points += getPoints(result.awayGoals, result.homeGoals, pointsConfig);
  }

  return stats;
}
