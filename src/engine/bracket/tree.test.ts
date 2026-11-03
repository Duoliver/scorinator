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
