import { describe, expect, it } from 'vitest';
import {
  buildBracketTree,
  type BracketRound,
  type BracketTieResult,
} from '@/engine/bracket';
import { calculateStandings, type MatchResult } from '@/engine/standings';
import { finalRanking, type PhaseOrderInput } from './index';

const win = (home: string, away: string): MatchResult<string> => ({
  home,
  away,
  homeGoals: 1,
  awayGoals: 0,
});

/** A table where the teams finish in the given order: each team beats each
 * team after it. */
function tableInOrder(
  order: readonly string[]
): ReturnType<typeof calculateStandings<string>> {
  const results = order.flatMap((team, i) =>
    order.slice(i + 1).map((other) => win(team, other))
  );
  return calculateStandings([...order].reverse(), results);
}

function treeOf(
  seeds: string[],
  byeTeams: string[] = [],
  thirdPlace = false
): BracketRound<string>[] {
  const tree = buildBracketTree(2, seeds, byeTeams, thirdPlace);
  if (tree.status !== 'ready') throw new Error('expected a ready tree');
  return tree.rounds;
}

/** The result of a tie, found by its round and its tie number. The final
 * is tie 1 of the last round, the third-place tie is tie 2. */
function tieResult(
  rounds: BracketRound<string>[],
  round: number,
  tie: number,
  winnerId: string,
  loserId: string
): BracketTieResult<string> {
  const found = rounds[round - 1].ties.find((t) => t.tie === tie);
  if (!found) throw new Error(`no tie ${tie} in round ${round}`);
  return { tieId: found.id, matches: [], winnerId, loserId, decidedBy: 'regulation' };
}

const bracket = (
  seeds: string[],
  rounds: BracketRound<string>[] | null,
  results: BracketTieResult<string>[] = []
): PhaseOrderInput<string> => ({ format: 'bracket', seeds, rounds, results });

describe('finalRanking (US-10.5, Task 147)', () => {
  it('gives the table order of a one-phase round robin', () => {
    expect(
      finalRanking([{ format: 'round-robin', tables: [tableInOrder(['c', 'a', 'b'])] }])
    ).toEqual(['c', 'a', 'b']);
  });

  it('orders a Groups phase by place, then across groups', () => {
    // Place 1: a1 and b1 have the same rates a match, so the group order
    // stays. Place 2: b2 has 1.5 points a match, a2 has 0, so b2 is first.
    const groups = [tableInOrder(['a1', 'a2']), tableInOrder(['b1', 'b2', 'b3'])];
    expect(finalRanking([{ format: 'groups', tables: groups }])).toEqual([
      'a1',
      'b1',
      'b2',
      'a2',
      'b3',
    ]);
  });

  it('puts the teams of a later phase first, then the others in their phase order', () => {
    const phase1 = tableInOrder(['a', 'b', 'c', 'd', 'e', 'f']);
    const phase2 = tableInOrder(['c', 'a', 'b', 'd']);
    expect(
      finalRanking([
        { format: 'round-robin', tables: [phase1] },
        { format: 'round-robin', tables: [phase2] },
      ])
    ).toEqual(['c', 'a', 'b', 'd', 'e', 'f']);
  });

  describe('a bracket', () => {
    const seeds = ['s1', 's2', 's3', 's4'];

    it('with no result: the seed order', () => {
      expect(finalRanking([bracket(seeds, treeOf(seeds))])).toEqual(seeds);
    });

    it('with a third place: the final winner, the loser, then the third-place winner and loser', () => {
      const rounds = treeOf(seeds, [], true);
      const results = [
        tieResult(rounds, 1, 1, 's4', 's1'),
        tieResult(rounds, 1, 2, 's2', 's3'),
        tieResult(rounds, 2, 1, 's2', 's4'),
        tieResult(rounds, 2, 2, 's3', 's1'),
      ];
      expect(finalRanking([bracket(seeds, rounds, results)])).toEqual([
        's2',
        's4',
        's3',
        's1',
      ]);
    });

    it('with no third place: the semi-final losers in seed order', () => {
      const rounds = treeOf(seeds);
      const results = [
        tieResult(rounds, 1, 1, 's4', 's1'),
        tieResult(rounds, 1, 2, 's3', 's2'),
        tieResult(rounds, 2, 1, 's3', 's4'),
      ];
      expect(finalRanking([bracket(seeds, rounds, results)])).toEqual([
        's3',
        's4',
        's1',
        's2',
      ]);
    });

    it('a final with no result: its two teams in seed order, before the semi-final losers', () => {
      const rounds = treeOf(seeds, [], true);
      const results = [
        tieResult(rounds, 1, 1, 's4', 's1'),
        tieResult(rounds, 1, 2, 's3', 's2'),
      ];
      expect(finalRanking([bracket(seeds, rounds, results)])).toEqual([
        's3',
        's4',
        's1',
        's2',
      ]);
    });

    it('a bye team reached round 2 before any play (choice 2)', () => {
      const six = ['s1', 's2', 's3', 's4', 's5', 's6'];
      const rounds = treeOf(six, ['s1', 's5']);
      expect(finalRanking([bracket(six, rounds)])).toEqual([
        's1',
        's5',
        's2',
        's3',
        's4',
        's6',
      ]);
    });

    it('waiting for its byes: the seed order (choice 3)', () => {
      expect(finalRanking([bracket(['s1', 's2', 's3'], null)])).toEqual([
        's1',
        's2',
        's3',
      ]);
    });
  });

  it('Groups → Bracket: the bracket teams first, then the group order', () => {
    const groups = [tableInOrder(['a1', 'a2', 'a3']), tableInOrder(['b1', 'b2', 'b3'])];
    const seeds = ['a1', 'b1', 'a2', 'b2'];
    const rounds = treeOf(seeds);
    const results = [
      tieResult(rounds, 1, 1, 'b2', 'a1'),
      tieResult(rounds, 1, 2, 'b1', 'a2'),
      tieResult(rounds, 2, 1, 'b1', 'b2'),
    ];
    expect(
      finalRanking([
        { format: 'groups', tables: groups },
        bracket(seeds, rounds, results),
      ])
    ).toEqual(['b1', 'b2', 'a1', 'a2', 'a3', 'b3']);
  });
});
