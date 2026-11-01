import type { Rng } from '@/engine/rng';
import { pairByCircle, shuffleWithinMatchdays } from './circlePairing';
import type { Fixture, RoundRobinSchedule } from './types';

/**
 * Generates a single-duels round-robin schedule for N teams (US-06.1,
 * Task 82): each pair of teams meets once. The pairings and byes come from
 * the circle method, in the team order, the same as the first leg of
 * `generateRoundRobin`.
 *
 * Home and away are random, inside a balance rule: each team's home and
 * away counts differ by at most 1, and by 0 when N is odd. When N is even,
 * the `rng` picks which teams get the extra home match. There is no limit
 * on home or away streaks.
 *
 * The `rng` picks home and away first, then shuffles the match order
 * inside each matchday (Task 30). The same seed gives the same schedule.
 *
 * Throws a `RangeError` for fewer than 2 teams, as `generateRoundRobin`
 * does.
 */
export function generateSingleDuels<TeamId>(
  teams: readonly TeamId[],
  rng: Rng
): RoundRobinSchedule<TeamId> {
  if (teams.length < 2) {
    throw new RangeError(
      `generateSingleDuels needs at least 2 teams, got ${teams.length}. It follows generateRoundRobin, see the Task 3 decision log.`
    );
  }

  // Work on team positions, so two equal TeamId values cannot mix.
  const positions = teams.map((_, i) => i);
  const { pairings, byes } = pairByCircle(positions);
  const aIsHome = pickHomeSides(
    teams.length,
    pairings.map(({ a, b }) => [a, b] as const),
    rng
  );

  const fixtures: Fixture<TeamId>[] = pairings.map(({ matchday, a, b }, i) =>
    aIsHome[i]
      ? { matchday, home: teams[a], away: teams[b] }
      : { matchday, home: teams[b], away: teams[a] }
  );

  return {
    fixtures: shuffleWithinMatchdays(fixtures, rng),
    byes: byes.map(({ matchday, team }) => ({ matchday, team: teams[team] })),
  };
}

/**
 * Picks the home side of each match, so that each team's home and away
 * counts differ by at most 1 (Task 123 choices 1 and 2).
 *
 * Each match is an edge between two teams. An odd team count gives each
 * team an even number of edges. An even count gives an odd number, so one
 * random dummy edge for each team makes it even. A walk along an Euler
 * circuit leaves each team as often as it enters it. The walk direction
 * gives the home side: the team that the walk leaves is home. A dropped
 * dummy edge moves a team's balance by 1 at most.
 *
 * The `rng` picks the dummy edges, the start team, the next edge at each
 * step, and the walk direction. The random direction flips every match
 * with the same chance, so each side of a pairing is home in 50% of seeds
 * on average.
 *
 * Returns, for each match in order, `true` when its `a` side is home.
 */
function pickHomeSides(
  teamCount: number,
  matches: readonly (readonly [number, number])[],
  rng: Rng
): boolean[] {
  const edges: (readonly [number, number])[] = [...matches];
  if (teamCount % 2 === 0) {
    const order = shuffled(
      Array.from({ length: teamCount }, (_, i) => i),
      rng
    );
    for (let i = 0; i < teamCount; i += 2) edges.push([order[i], order[i + 1]]);
  }

  const edgesOfTeam: number[][] = Array.from({ length: teamCount }, () => []);
  edges.forEach(([a, b], edge) => {
    edgesOfTeam[a].push(edge);
    edgesOfTeam[b].push(edge);
  });
  for (let team = 0; team < teamCount; team++) {
    edgesOfTeam[team] = shuffled(edgesOfTeam[team], rng);
  }

  // Hierholzer's walk. Each edge is walked once. The team the walk leaves
  // is the `from` side of that edge.
  const fromTeam = new Array<number>(edges.length);
  const used = new Array<boolean>(edges.length).fill(false);
  const nextIndex = new Array<number>(teamCount).fill(0);
  const stack = [Math.floor(rng() * teamCount)];
  while (stack.length > 0) {
    const team = stack[stack.length - 1];
    const list = edgesOfTeam[team];
    while (nextIndex[team] < list.length && used[list[nextIndex[team]]]) {
      nextIndex[team]++;
    }
    if (nextIndex[team] === list.length) {
      stack.pop();
      continue;
    }
    const edge = list[nextIndex[team]];
    used[edge] = true;
    fromTeam[edge] = team;
    const [a, b] = edges[edge];
    stack.push(a === team ? b : a);
  }

  const reverse = rng() < 0.5;
  return matches.map(([a], edge) => (fromTeam[edge] === a) !== reverse);
}

// Fisher-Yates on a copy.
function shuffled<T>(items: readonly T[], rng: Rng): T[] {
  const result = items.slice();
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
