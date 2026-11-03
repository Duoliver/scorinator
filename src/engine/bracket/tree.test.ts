import { describe, expect, it } from 'vitest';
import {
  buildBracketTree,
  defaultByeTeams,
  standardPlacement,
  type BracketRound,
  type BracketSlot,
  type BracketTie,
} from './index';

function teamsOf(n: number): string[] {
  return Array.from({ length: n }, (_, i) => `s${i + 1}`);
}

function roundsOf(
  phase: number,
  seeds: string[],
  byeTeams: string[]
): BracketRound<string>[] {
  const tree = buildBracketTree(phase, seeds, byeTeams);
  if (tree.status !== 'ready')
    throw new Error(`The tree is not ready: ${tree.status}.`);
  return tree.rounds;
}

// A short text for a slot: the team id, "BYE", or "W(tie id)".
function slotText(slot: BracketSlot<string>): string {
  if (slot.kind === 'team') return slot.teamId;
  if (slot.kind === 'bye') return 'BYE';
  return `W(${slot.tieId})`;
}

function tieText(tie: BracketTie<string>): string {
  return `${slotText(tie.slots[0])} v ${slotText(tie.slots[1])}`;
}

describe('defaultByeTeams (US-04.10)', () => {
  it.each([
    [2, []],
    [3, ['s1']],
    [6, ['s1', 's2']],
    [8, []],
    [12, ['s1', 's2', 's3', 's4']],
  ])('%i qualifiers: the top seeds get the byes', (n, byes) => {
    expect(defaultByeTeams(teamsOf(n))).toEqual(byes);
  });
});

describe('buildBracketTree: no byes', () => {
  it('8 qualifiers: three rounds, ids, and the standard placement', () => {
    const rounds = roundsOf(2, teamsOf(8), []);
    expect(rounds.map((round) => round.teams)).toEqual([8, 4, 2]);
    expect(rounds[0].ties.map(tieText)).toEqual([
      's1 v s8',
      's4 v s5',
      's2 v s7',
      's3 v s6',
    ]);
    expect(rounds[0].ties.map((tie) => tie.id)).toEqual([
      'p2.r1.t1',
      'p2.r1.t2',
      'p2.r1.t3',
      'p2.r1.t4',
    ]);
    expect(rounds[1].ties.map(tieText)).toEqual([
      'W(p2.r1.t1) v W(p2.r1.t2)',
      'W(p2.r1.t3) v W(p2.r1.t4)',
    ]);
    expect(rounds[2].ties.map((tie) => tie.id)).toEqual(['p2.r3.final']);
    expect(rounds[2].ties.map(tieText)).toEqual(['W(p2.r2.t1) v W(p2.r2.t2)']);
  });

  it('2 qualifiers: the final only', () => {
    const rounds = roundsOf(1, teamsOf(2), []);
    expect(rounds).toHaveLength(1);
    expect(rounds[0].ties.map((tie) => [tie.id, tieText(tie)])).toEqual([
      ['p1.r1.final', 's1 v s2'],
    ]);
  });

  it('keeps the seed of each known team, and the round and tie numbers', () => {
    const [first] = roundsOf(1, teamsOf(8), []);
    const tie = first.ties[1];
    expect(tie).toMatchObject({ round: 1, tie: 2 });
    expect(tie.slots).toEqual([
      { kind: 'team', teamId: 's4', seed: 4 },
      { kind: 'team', teamId: 's5', seed: 5 },
    ]);
  });

  it.each([2, 4, 8, 16, 32, 64])(
    '%i qualifiers: each later tie takes the winners of two adjacent ties',
    (n) => {
      const rounds = roundsOf(1, teamsOf(n), []);
      for (let r = 1; r < rounds.length; r++) {
        rounds[r].ties.forEach((tie, i) => {
          expect(tie.slots).toEqual([
            { kind: 'winner-of', tieId: rounds[r - 1].ties[2 * i].id },
            { kind: 'winner-of', tieId: rounds[r - 1].ties[2 * i + 1].id },
          ]);
        });
      }
    }
  );
});

describe('buildBracketTree: byes (US-04.10, US-04.11)', () => {
  it('6 qualifiers, default byes: seeds 1 and 2 have a bye, by the placement', () => {
    const seeds = teamsOf(6);
    const rounds = roundsOf(1, seeds, defaultByeTeams(seeds));
    expect(rounds.map((round) => round.teams)).toEqual([8, 4, 2]);
    expect(rounds[0].ties.map(tieText)).toEqual([
      's1 v BYE',
      's4 v s5',
      's2 v BYE',
      's3 v s6',
    ]);
  });

  it('a bye team is in its next-round tie from the start, as a known team', () => {
    const seeds = teamsOf(6);
    const rounds = roundsOf(1, seeds, defaultByeTeams(seeds));
    expect(rounds[1].ties.map(tieText)).toEqual([
      's1 v W(p1.r1.t2)',
      's2 v W(p1.r1.t4)',
    ]);
    expect(rounds[1].ties[0].slots[0]).toEqual({ kind: 'team', teamId: 's1', seed: 1 });
  });

  it('a bye tie has the team in the first slot and the bye in the second', () => {
    const seeds = teamsOf(3);
    const [first] = roundsOf(1, seeds, ['s1']);
    expect(first.ties[0].slots).toEqual([
      { kind: 'team', teamId: 's1', seed: 1 },
      { kind: 'bye' },
    ]);
  });

  it('3 qualifiers: the bye team meets the winner of the other tie in the final', () => {
    const rounds = roundsOf(1, teamsOf(3), ['s1']);
    expect(rounds[0].ties.map(tieText)).toEqual(['s1 v BYE', 's2 v s3']);
    expect(rounds[1].ties.map((tie) => [tie.id, tieText(tie)])).toEqual([
      ['p1.r2.final', 's1 v W(p1.r1.t2)'],
    ]);
  });

  it('a bye change: the bye teams take the bye slots in seed order, the others the rest', () => {
    // 6 qualifiers, the byes go to seeds 3 and 5. Bye slots: those of seeds
    // 1 and 2. The others (1, 2, 4, 6) take the slots of seeds 3 to 6.
    const rounds = roundsOf(1, teamsOf(6), ['s5', 's3']);
    expect(rounds[0].ties.map(tieText)).toEqual([
      's3 v BYE',
      's2 v s4',
      's5 v BYE',
      's1 v s6',
    ]);
  });

  it('a bye change keeps the seeds of the teams', () => {
    const [first] = roundsOf(1, teamsOf(6), ['s5', 's3']);
    expect(first.ties[0].slots[0]).toEqual({ kind: 'team', teamId: 's3', seed: 3 });
    expect(first.ties[3].slots[0]).toEqual({ kind: 'team', teamId: 's1', seed: 1 });
  });

  it('a bye change moves the bye teams in the next round with it', () => {
    const rounds = roundsOf(1, teamsOf(6), ['s5', 's3']);
    expect(rounds[1].ties.map(tieText)).toEqual([
      's3 v W(p1.r1.t2)',
      's5 v W(p1.r1.t4)',
    ]);
  });

  it.each([3, 5, 6, 7, 9, 12, 17, 33])(
    '%i qualifiers, default byes: each team once, and byes = slots − qualifiers',
    (n) => {
      const seeds = teamsOf(n);
      const [first] = roundsOf(1, seeds, defaultByeTeams(seeds));
      const slots = first.ties.flatMap((tie) => tie.slots);
      const teams = slots.flatMap((slot) =>
        slot.kind === 'team' ? [slot.teamId] : []
      );
      expect(teams.sort()).toEqual([...seeds].sort());
      expect(slots.filter((slot) => slot.kind === 'bye')).toHaveLength(first.teams - n);
      // A bye never meets a bye.
      for (const tie of first.ties) expect(tie.slots[0].kind).toBe('team');
      expect(first.teams).toBe(standardPlacement(first.teams).length);
    }
  );

  it('fewer bye teams than byes: no tree, and the counts', () => {
    expect(buildBracketTree(1, teamsOf(6), ['s1'])).toEqual({
      status: 'missing-byes',
      byes: 2,
      assigned: 1,
    });
    expect(buildBracketTree(1, teamsOf(6), [])).toEqual({
      status: 'missing-byes',
      byes: 2,
      assigned: 0,
    });
  });

  it('throws a RangeError for more bye teams than byes', () => {
    expect(() => buildBracketTree(1, teamsOf(6), ['s1', 's2', 's3'])).toThrow(
      RangeError
    );
    expect(() => buildBracketTree(1, teamsOf(8), ['s1'])).toThrow(RangeError);
  });

  it('throws a RangeError for a bye team that is not a qualifier, or named twice', () => {
    expect(() => buildBracketTree(1, teamsOf(6), ['s1', 'x'])).toThrow(RangeError);
    expect(() => buildBracketTree(1, teamsOf(6), ['s1', 's1'])).toThrow(RangeError);
  });

  it('throws a RangeError for fewer than 2 qualifiers, or a team named twice', () => {
    expect(() => buildBracketTree(1, ['s1'], [])).toThrow(RangeError);
    expect(() => buildBracketTree(1, ['s1', 's2', 's1'], ['s1'])).toThrow(RangeError);
  });

  it('does not change its inputs', () => {
    const seeds = teamsOf(6);
    const byes = ['s5', 's3'];
    buildBracketTree(1, seeds, byes);
    expect(seeds).toEqual(teamsOf(6));
    expect(byes).toEqual(['s5', 's3']);
  });
});

describe('buildBracketTree: the third-place tie (US-04.12)', () => {
  it('is off by default', () => {
    const rounds = roundsOf(1, teamsOf(8), []);
    expect(rounds[2].ties.map((tie) => tie.id)).toEqual(['p1.r3.final']);
  });

  it('8 qualifiers: the losers of the semi-finals, before the final in the last round', () => {
    const tree = buildBracketTree(1, teamsOf(8), [], true);
    if (tree.status !== 'ready') throw new Error('The tree is not ready.');
    const last = tree.rounds[2];
    expect(last.ties.map((tie) => [tie.id, tie.kind])).toEqual([
      ['p1.r3.third', 'third'],
      ['p1.r3.final', 'final'],
    ]);
    expect(last.ties[0].slots).toEqual([
      { kind: 'loser-of', tieId: 'p1.r2.t1' },
      { kind: 'loser-of', tieId: 'p1.r2.t2' },
    ]);
  });

  it('4 qualifiers: the losers of the first round', () => {
    const tree = buildBracketTree(1, teamsOf(4), [], true);
    if (tree.status !== 'ready') throw new Error('The tree is not ready.');
    expect(tree.rounds[1].ties[0].slots).toEqual([
      { kind: 'loser-of', tieId: 'p1.r1.t1' },
      { kind: 'loser-of', tieId: 'p1.r1.t2' },
    ]);
  });

  it.each([2, 3])('%i qualifiers: no third-place tie, even with the flag on', (n) => {
    const seeds = teamsOf(n);
    const tree = buildBracketTree(1, seeds, defaultByeTeams(seeds), true);
    if (tree.status !== 'ready') throw new Error('The tree is not ready.');
    const ties = tree.rounds.flatMap((round) => round.ties);
    expect(ties.some((tie) => tie.kind === 'third')).toBe(false);
  });

  it('marks the other ties as regular ties', () => {
    const rounds = roundsOf(1, teamsOf(8), []);
    expect(rounds[0].ties.every((tie) => tie.kind === 'regular')).toBe(true);
    expect(rounds[2].ties[0].kind).toBe('final');
  });
});

describe('buildBracketTree: no same-group tie in the first round (Task 185)', () => {
  // A team id names its group and its place, for example "B2".
  const groupOf = (teams: readonly string[]): Map<string, number> =>
    new Map(teams.map((team) => [team, team.charCodeAt(0) - 65]));
  const firstRound = (seeds: string[], byes: string[] = []): string[] => {
    const tree = buildBracketTree(1, seeds, byes, false, groupOf(seeds));
    if (tree.status !== 'ready') throw new Error('expected a ready tree');
    return tree.rounds[0].ties.map(tieText);
  };

  it('the review case: 4 groups, top 2, B1 v B2 and C1 v C2 swap away', () => {
    // The 4 winners are seeds 1 to 4, the runners-up seeds 5 to 8.
    const seeds = ['A1', 'B1', 'C1', 'D1', 'D2', 'C2', 'B2', 'A2'];
    // Without the rule: A1 v A2, D1 v D2, B1 v B2, C1 v C2.
    const plain = buildBracketTree(1, seeds, []);
    if (plain.status !== 'ready') throw new Error('expected a ready tree');
    expect(plain.rounds[0].ties.map(tieText)).toEqual([
      'A1 v A2',
      'D1 v D2',
      'B1 v B2',
      'C1 v C2',
    ]);
    const ties = firstRound(seeds);
    for (const tie of ties) {
      const [top, bottom] = tie.split(' v ');
      expect(top[0]).not.toBe(bottom[0]);
    }
    // The top team of each tie stays. A2 swaps with the nearest lower team,
    // B2 (seed 7). Then D2 swaps with its nearest, C2 (seed 6).
    expect(ties).toEqual(['A1 v B2', 'D1 v C2', 'B1 v A2', 'C1 v D2']);
  });

  it('swaps with the nearest seed number first', () => {
    // 1 v 4 is A1 v A2: the only other lower team is B2 (seed 3).
    expect(firstRound(['A1', 'B1', 'B2', 'A2'])).toEqual(['A1 v B2', 'B1 v A2']);
  });

  it('keeps the seeds of the teams after a swap', () => {
    const tree = buildBracketTree(
      1,
      ['A1', 'B1', 'B2', 'A2'],
      [],
      false,
      groupOf(['A1', 'B1', 'B2', 'A2'])
    );
    if (tree.status !== 'ready') throw new Error('expected a ready tree');
    expect(tree.rounds[0].ties[0].slots[1]).toEqual({
      kind: 'team',
      teamId: 'B2',
      seed: 3,
    });
  });

  it('never moves a bye: 3 groups, top 2, 2 byes', () => {
    // Seeds A1 B1 C1 C2 B2 A2: ties 1 v BYE, 4 v 5 (C2 v B2), 2 v BYE, 3 v 6 (C1 v A2).
    // No clash: no change.
    const seeds = ['A1', 'B1', 'C1', 'C2', 'B2', 'A2'];
    expect(firstRound(seeds, ['A1', 'B1'])).toEqual([
      'A1 v BYE',
      'C2 v B2',
      'B1 v BYE',
      'C1 v A2',
    ]);
    // C1 v C2 in 3 v 6: C2 swaps with the lower team of 4 v 5.
    const clash = ['A1', 'B1', 'C1', 'B2', 'A2', 'C2'];
    expect(firstRound(clash, ['A1', 'B1'])).toEqual([
      'A1 v BYE',
      'B2 v C2',
      'B1 v BYE',
      'C1 v A2',
    ]);
  });

  it('leaves a tie with no valid swap as it is', () => {
    expect(firstRound(['A1', 'A2'])).toEqual(['A1 v A2']);
  });

  it('changes nothing for a team with no group', () => {
    const seeds = ['A1', 'B1', 'B2', 'A2'];
    const tree = buildBracketTree(1, seeds, [], false, new Map());
    if (tree.status !== 'ready') throw new Error('expected a ready tree');
    expect(tree.rounds[0].ties.map(tieText)).toEqual(['A1 v A2', 'B1 v B2']);
  });

  it.each([
    [8, 4],
    [16, 8],
    [32, 16],
  ])(
    '%i qualifiers from %i groups of 2: no same-group tie, and the tops stay',
    (n, groups) => {
      const letters = Array.from({ length: groups }, (_, i) =>
        String.fromCharCode(65 + i)
      );
      for (let shift = 0; shift < groups; shift++) {
        // Winners in group order, runners-up in a rotated order.
        const winners = letters.map((g) => `${g}1`);
        const runners = letters.map((_, i) => `${letters[(i + shift) % groups]}2`);
        const seeds = [...winners, ...runners];
        const tree = buildBracketTree(1, seeds, [], false, groupOf(seeds));
        if (tree.status !== 'ready') throw new Error('expected a ready tree');
        const plain = buildBracketTree(1, seeds, []);
        if (plain.status !== 'ready') throw new Error('expected a ready tree');
        tree.rounds[0].ties.forEach((tie, i) => {
          const [top, bottom] = tie.slots;
          expect(top).toEqual(plain.rounds[0].ties[i].slots[0]);
          if (top.kind === 'team' && bottom.kind === 'team') {
            expect(top.teamId[0]).not.toBe(bottom.teamId[0]);
          }
        });
        expect(tree.rounds[0].ties).toHaveLength(n / 2);
      }
    }
  );
});
