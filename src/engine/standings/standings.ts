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

  const sorted = [...rows.values()].sort((a, b) => compareRows(a, b, teams, results));
  assignPositions(sorted, results);
  return sorted;
}

/**
 * `sortOrder` is the row's place in the table, 1 upward, always unique —
 * roster order is the tie-break of last resort, so no two rows ever share
 * it. `position` is the standings rank a user would read off the table:
 * teams level on every footballing criterion (points, goal difference,
 * goals for, head-to-head) share one `position`, the way a real league
 * table shows joint places. `positionText` is `position` as a string on
 * the first row of a tied group, and `'-'` on the rest of that group, so
 * a rendered table does not repeat the same number down a tied block.
 */
function assignPositions<TeamId>(
  sorted: StandingsRow<TeamId>[],
  results: readonly MatchResult<TeamId>[]
): void {
  let position = 1;
  sorted.forEach((row, index) => {
    const sortOrder = index + 1;
    const previous = sorted[index - 1];
    const tiedWithPrevious = index > 0 && compareByStanding(previous, row, results) === 0;
    if (!tiedWithPrevious) position = sortOrder;

    row.sortOrder = sortOrder;
    row.position = position;
    row.positionText = sortOrder === position ? String(position) : '-';
  });
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

// Points desc, then goal difference desc, then goals for desc, then head
// to head, then the team's position in the input roster — deterministic,
// no RNG involved. Roster order is a display tie-break, not a footballing
// one, so it lives here and not in `compareByStanding` below.
function compareRows<TeamId>(
  a: StandingsRow<TeamId>,
  b: StandingsRow<TeamId>,
  teams: readonly TeamId[],
  results: readonly MatchResult<TeamId>[]
): number {
  const byStanding = compareByStanding(a, b, results);
  if (byStanding !== 0) return byStanding;
  return teams.indexOf(a.team) - teams.indexOf(b.team);
}

// The footballing criteria only: points, goal difference, goals for, head
// to head. Two rows compare equal here exactly when they share one
// `position` — this is what `assignPositions` above checks for.
function compareByStanding<TeamId>(
  a: StandingsRow<TeamId>,
  b: StandingsRow<TeamId>,
  results: readonly MatchResult<TeamId>[]
): number {
  if (b.points !== a.points) return b.points - a.points;
  if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
  if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
  return compareHeadToHead(a.team, b.team, results);
}

// Direct confrontation: only reached once points, goal difference, and
// goals for are already tied. Looks at the matches played between exactly
// these two teams (none, one, or two in an ongoing two-way round robin).
// Whoever won more of those matches ranks first. A 0-0 or 1-1 split on
// wins falls back to the aggregate goals each scored against the other,
// the same number as their aggregate goal difference against each other
// (their conceded goals are, by definition, the other's scored goals in
// this closed two-team subset). Still tied after that: fall through to
// the roster-order tie-break above.
function compareHeadToHead<TeamId>(
  teamA: TeamId,
  teamB: TeamId,
  results: readonly MatchResult<TeamId>[]
): number {
  let winsA = 0;
  let winsB = 0;
  let goalsA = 0;
  let goalsB = 0;

  for (const result of results) {
    const isAHome = result.home === teamA && result.away === teamB;
    const isBHome = result.home === teamB && result.away === teamA;
    if (!isAHome && !isBHome) continue;

    const [goalsForA, goalsForB] = isAHome
      ? [result.homeGoals, result.awayGoals]
      : [result.awayGoals, result.homeGoals];
    goalsA += goalsForA;
    goalsB += goalsForB;
    if (goalsForA > goalsForB) winsA++;
    else if (goalsForA < goalsForB) winsB++;
  }

  if (winsA !== winsB) return winsB - winsA;
  return goalsB - goalsA;
}
