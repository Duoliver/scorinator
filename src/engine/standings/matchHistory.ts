import { calculateStandings } from './standings';
import type { LotOf, MatchResult, PointsConfig } from './types';

/** The part of a fixture that these functions read. A result finds its
 * matchday through its fixture (Task 77). */
export interface MatchdayFixture {
  id: string;
  matchday: number;
}

export type FixtureResult<TeamId> = MatchResult<TeamId> & { fixtureId: string };

export const MatchOutcome = { WIN: 'W', DRAW: 'D', LOSS: 'L' } as const;
export type MatchOutcome = (typeof MatchOutcome)[keyof typeof MatchOutcome];

/** One match from the view of one team (US-12.1). */
export interface TeamMatchResult<TeamId> {
  outcome: MatchOutcome;
  opponent: TeamId;
  isHome: boolean;
  goalsFor: number;
  goalsAgainst: number;
  matchday: number;
}

/** The place of each team after one matchday (US-12.4). */
export interface MatchdayPlaces<TeamId> {
  matchday: number;
  places: ReadonlyMap<TeamId, number>;
}

/**
 * The results with their matchdays, in matchday order. A result with no
 * fixture in the list does not count, so a caller can give the fixtures of
 * one group with the results of the whole phase.
 */
function getResultsByMatchday<TeamId>(
  fixtures: readonly MatchdayFixture[],
  results: readonly FixtureResult<TeamId>[]
): { result: FixtureResult<TeamId>; matchday: number }[] {
  const matchdayOf = new Map(fixtures.map((f) => [f.id, f.matchday]));
  return results
    .flatMap((result) => {
      const matchday = matchdayOf.get(result.fixtureId);
      return matchday === undefined ? [] : [{ result, matchday }];
    })
    .sort((a, b) => a.matchday - b.matchday);
}

function getOutcome(goalsFor: number, goalsAgainst: number): MatchOutcome {
  if (goalsFor > goalsAgainst) return MatchOutcome.WIN;
  return goalsFor < goalsAgainst ? MatchOutcome.LOSS : MatchOutcome.DRAW;
}

/**
 * The last `count` results of a team in one phase, the oldest first. The
 * order is the matchday order, so a re-scorinated match keeps its place.
 */
export function getLastResults<TeamId>(
  team: TeamId,
  fixtures: readonly MatchdayFixture[],
  results: readonly FixtureResult<TeamId>[],
  count: number
): TeamMatchResult<TeamId>[] {
  const own = getResultsByMatchday(fixtures, results).filter(
    ({ result }) => result.home === team || result.away === team
  );
  return own.slice(Math.max(0, own.length - count)).map(({ result, matchday }) => {
    const isHome = result.home === team;
    const goalsFor = isHome ? result.homeGoals : result.awayGoals;
    const goalsAgainst = isHome ? result.awayGoals : result.homeGoals;
    return {
      outcome: getOutcome(goalsFor, goalsAgainst),
      opponent: isHome ? result.away : result.home,
      isHome,
      goalsFor,
      goalsAgainst,
      matchday,
    };
  });
}

/**
 * The place of each team after each matchday with at least one result. A
 * point uses the results of that matchday and of each matchday before it.
 * A place is the row number of the table, so teams that share a place take
 * their row order, and a point has no repeated place (US-12.4).
 */
export function getPlacesByMatchday<TeamId>(
  teams: readonly TeamId[],
  fixtures: readonly MatchdayFixture[],
  results: readonly FixtureResult<TeamId>[],
  pointsConfig: PointsConfig,
  lotOf?: LotOf<TeamId>
): MatchdayPlaces<TeamId>[] {
  const ordered = getResultsByMatchday(fixtures, results);
  const matchdays = [...new Set(ordered.map(({ matchday }) => matchday))];
  return matchdays.map((matchday) => {
    const soFar = ordered.filter((entry) => entry.matchday <= matchday);
    const rows = calculateStandings(
      teams,
      soFar.map(({ result }) => result),
      pointsConfig,
      lotOf
    );
    return {
      matchday,
      places: new Map(rows.map((row, index) => [row.team, index + 1])),
    };
  });
}
