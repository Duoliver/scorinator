import {
  findTieTeams,
  type BracketRound,
  type BracketTieResult,
} from '@/engine/bracket';
import { orderAcrossGroups, type LotOf, type StandingsRow } from '@/engine/standings';

/**
 * What the final ranking needs from one started phase (Task 147 choice 1).
 *
 * - `round-robin`: its one table. `groups`: one table for each group, in
 *   group order. Each table comes from `calculateStandings`, with the lots.
 * - `bracket`: its seeds, its tree, and its tie results. `rounds` is `null`
 *   while the bracket waits for its byes (US-04.10).
 */
export type PhaseOrderInput<TeamId> =
  | {
      format: 'round-robin' | 'groups';
      tables: readonly (readonly StandingsRow<TeamId>[])[];
    }
  | {
      format: 'bracket';
      seeds: readonly TeamId[];
      rounds: readonly BracketRound<TeamId>[] | null;
      results: readonly BracketTieResult<TeamId>[];
    };

/**
 * The final ranking of a league from its current results (US-10.5): the
 * teams of a later phase first, then each team that went out in an earlier
 * phase, in the order of that phase. Pass one input for each started phase,
 * in phase order. The inputs do not change.
 */
export function finalRanking<TeamId>(
  phases: readonly PhaseOrderInput<TeamId>[],
  lotOf?: LotOf<TeamId>
): TeamId[] {
  const ranking: TeamId[] = [];
  const listed = new Set<TeamId>();
  for (const phase of [...phases].reverse()) {
    for (const team of phaseOrder(phase, lotOf)) {
      if (listed.has(team)) continue;
      listed.add(team);
      ranking.push(team);
    }
  }
  return ranking;
}

/** The order of the teams inside one phase. */
function phaseOrder<TeamId>(
  phase: PhaseOrderInput<TeamId>,
  lotOf?: LotOf<TeamId>
): TeamId[] {
  if (phase.format === 'bracket') return bracketOrder(phase);
  return tableOrder(phase.tables, lotOf);
}

/**
 * Place 1 of each table, then place 2, and so on. Inside one place, the
 * Task 78 cross-group order. With one table, this is the table order.
 */
function tableOrder<TeamId>(
  tables: readonly (readonly StandingsRow<TeamId>[])[],
  lotOf?: LotOf<TeamId>
): TeamId[] {
  const places = Math.max(0, ...tables.map((table) => table.length));
  const order: TeamId[] = [];
  for (let place = 0; place < places; place++) {
    const rows = tables.flatMap((table) => (table[place] ? [table[place]] : []));
    order.push(...orderAcrossGroups(rows, lotOf).map((row) => row.team));
  }
  return order;
}

/** Where a team stands in a bracket: the last tie it reached. */
interface Reach {
  /** Two for each round, plus one for the final, so the final comes before
   * the third-place tie of the same round. */
  level: number;
  /** 0 for the winner of a played final or third-place tie, else 1. */
  place: number;
  seed: number;
}

/**
 * The round reached, later first. In the last round, the final, then the
 * third-place tie. Inside the final or the third-place tie with a result,
 * the winner, then the loser. Inside one round, the seed. A bracket with no
 * tree gives the seed order (choice 3).
 */
function bracketOrder<TeamId>(phase: {
  seeds: readonly TeamId[];
  rounds: readonly BracketRound<TeamId>[] | null;
  results: readonly BracketTieResult<TeamId>[];
}): TeamId[] {
  const { seeds, rounds, results } = phase;
  if (rounds === null) return [...seeds];

  const reach = new Map<TeamId, Reach>(
    seeds.map((team, seed) => [team, { level: 0, place: 1, seed }])
  );
  for (const round of rounds) {
    for (const tie of round.ties) {
      const level = round.round * 2 + (tie.kind === 'final' ? 1 : 0);
      const result = results.find((r) => r.tieId === tie.id);
      const decides = tie.kind !== 'regular' && result !== undefined;
      for (const side of findTieTeams(rounds, results, tie.id)) {
        if (side.kind !== 'team') continue;
        const current = reach.get(side.teamId);
        if (current === undefined || level < current.level) continue;
        current.level = level;
        current.place = decides && result.winnerId === side.teamId ? 0 : 1;
      }
    }
  }

  return [...seeds].sort((a, b) => {
    const x = reach.get(a) as Reach;
    const y = reach.get(b) as Reach;
    return y.level - x.level || x.place - y.place || x.seed - y.seed;
  });
}
