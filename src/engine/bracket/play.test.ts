import { describe, expect, it } from 'vitest';
import { createSeededRng } from '@/engine/rng';
import { playTie } from '@/engine/tiebreak';
import {
  buildBracketTree,
  defaultByeTeams,
  findBracketWinner,
  findCurrentRound,
  findDependentTies,
  findPlayableTies,
  findTieTeams,
  hasDependentResults,
  isBracketComplete,
  playBracketRound,
  playBracketTie,
  type BracketRound,
  type BracketRules,
  type BracketTieResult,
} from './index';

function teamsOf(n: number): string[] {
  return Array.from({ length: n }, (_, i) => `s${i + 1}`);
}

function roundsOf(n: number, thirdPlace = false): BracketRound<string>[] {
  const seeds = teamsOf(n);
  const tree = buildBracketTree(1, seeds, defaultByeTeams(seeds), thirdPlace);
  if (tree.status !== 'ready') throw new Error('The tree is not ready.');
  return tree.rounds;
}

// A hand-made result, so a test controls who wins.
function won(
  tieId: string,
  winnerId: string,
  loserId: string
): BracketTieResult<string> {
  return { tieId, matches: [], winnerId, loserId, decidedBy: 'regulation' };
}

// OVR 90 for s1, 89 for s2, and so on.
const ovrOf = (id: string): number => 91 - Number(id.slice(1));

const RULES: BracketRules = {
  format: 'two-legged',
  awayGoals: false,
  playsAet: true,
  method: 'penalties',
  homeAdvantage: true,
  singleMatchFinal: false,
  thirdPlace: true,
};

// Round 1 of 8 qualifiers, won by the higher seeds, except 8 beats 1.
const ROUND_1 = [
  won('p1.r1.t1', 's8', 's1'),
  won('p1.r1.t2', 's4', 's5'),
  won('p1.r1.t3', 's2', 's7'),
  won('p1.r1.t4', 's3', 's6'),
];

function idsOf(results: readonly { tieId: string }[]): string[] {
  return results.map((result) => result.tieId).sort();
}

describe('findTieTeams', () => {
  it('a later slot is TBD until its tie has a result', () => {
    expect(findTieTeams(roundsOf(8), [], 'p1.r2.t1')).toEqual([
      { kind: 'tbd' },
      { kind: 'tbd' },
    ]);
  });

  it('the winner keeps its first-round seed (Task 79)', () => {
    expect(findTieTeams(roundsOf(8), ROUND_1, 'p1.r2.t1')).toEqual([
      { kind: 'team', teamId: 's8', seed: 8 },
      { kind: 'team', teamId: 's4', seed: 4 },
    ]);
  });

  it('the third-place tie takes the losers of the semi-finals', () => {
    const results = [
      ...ROUND_1,
      won('p1.r2.t1', 's4', 's8'),
      won('p1.r2.t2', 's3', 's2'),
    ];
    expect(findTieTeams(roundsOf(8, true), results, 'p1.r3.third')).toEqual([
      { kind: 'team', teamId: 's8', seed: 8 },
      { kind: 'team', teamId: 's2', seed: 2 },
    ]);
  });

  it('a bye tie gives its team and a bye', () => {
    expect(findTieTeams(roundsOf(6), [], 'p1.r1.t1')).toEqual([
      { kind: 'team', teamId: 's1', seed: 1 },
      { kind: 'bye' },
    ]);
  });

  it('throws a RangeError for a tie id that is not in the tree', () => {
    expect(() => findTieTeams(roundsOf(8), [], 'p1.r9.t1')).toThrow(RangeError);
  });
});

describe('findPlayableTies (US-04.5)', () => {
  it('8 qualifiers: the four first-round ties', () => {
    expect(findPlayableTies(roundsOf(8), [])).toEqual([
      'p1.r1.t1',
      'p1.r1.t2',
      'p1.r1.t3',
      'p1.r1.t4',
    ]);
  });

  it('6 qualifiers: never a bye tie', () => {
    expect(findPlayableTies(roundsOf(6), [])).toEqual(['p1.r1.t2', 'p1.r1.t4']);
  });

  it('a tie with a result is not playable, and the next round opens tie by tie', () => {
    expect(findPlayableTies(roundsOf(8), ROUND_1.slice(0, 2))).toEqual([
      'p1.r1.t3',
      'p1.r1.t4',
      'p1.r2.t1',
    ]);
  });

  it('the third-place tie and the final open together, the third-place tie first', () => {
    const results = [
      ...ROUND_1,
      won('p1.r2.t1', 's4', 's8'),
      won('p1.r2.t2', 's3', 's2'),
    ];
    expect(findPlayableTies(roundsOf(8, true), results)).toEqual([
      'p1.r3.third',
      'p1.r3.final',
    ]);
  });
});

describe('playBracketTie (US-04.1, US-04.5, US-04.13)', () => {
  it('plays playTie with the OVRs, the higher seed first, and the tie rules', () => {
    const rounds = roundsOf(8, true);
    const results = playBracketTie(
      rounds,
      ROUND_1,
      'p1.r2.t1',
      RULES,
      ovrOf,
      createSeededRng(3)
    );
    const expected = playTie(
      { id: 's4', ovr: 87 },
      { id: 's8', ovr: 83 },
      {
        format: 'two-legged',
        awayGoals: false,
        playsAet: true,
        method: 'penalties',
        homeAdvantage: true,
      },
      createSeededRng(3)
    );
    expect(results.find((result) => result.tieId === 'p1.r2.t1')).toEqual({
      tieId: 'p1.r2.t1',
      ...expected,
    });
    // The higher seed, 4, plays the second leg at home.
    expect(expected.matches[1]).toMatchObject({ part: 'leg2', homeId: 's4' });
  });

  it('keeps the other results', () => {
    const results = playBracketTie(
      roundsOf(8),
      ROUND_1,
      'p1.r2.t1',
      RULES,
      ovrOf,
      createSeededRng(3)
    );
    expect(idsOf(results)).toEqual([...idsOf(ROUND_1), 'p1.r2.t1'].sort());
  });

  it.each([
    [true, 1],
    [false, 2],
  ])(
    'the single-match final set to %s: the final has %i matches',
    (singleMatchFinal, matches) => {
      const rounds = roundsOf(4, true);
      const semis = [won('p1.r1.t1', 's1', 's4'), won('p1.r1.t2', 's2', 's3')];
      const rules = { ...RULES, singleMatchFinal };
      for (const tieId of ['p1.r2.final', 'p1.r2.third']) {
        for (let seed = 0; seed < 50; seed++) {
          const results = playBracketTie(
            rounds,
            semis,
            tieId,
            rules,
            ovrOf,
            createSeededRng(seed)
          );
          const tie = results.find((result) => result.tieId === tieId);
          const regular = tie?.matches.filter((match) => match.part !== 'replay') ?? [];
          expect(regular).toHaveLength(matches);
        }
      }
    }
  );

  it('a single-match final is neutral and has no away goals', () => {
    const rounds = roundsOf(4);
    const semis = [won('p1.r1.t1', 's1', 's4'), won('p1.r1.t2', 's2', 's3')];
    const rules = { ...RULES, awayGoals: true, singleMatchFinal: true };
    const results = playBracketTie(
      rounds,
      semis,
      'p1.r2.final',
      rules,
      ovrOf,
      createSeededRng(8)
    );
    const expected = playTie(
      { id: 's1', ovr: 90 },
      { id: 's2', ovr: 89 },
      { ...RULES, format: 'single-match', awayGoals: false },
      createSeededRng(8)
    );
    expect(results.find((result) => result.tieId === 'p1.r2.final')).toMatchObject(
      expected
    );
  });

  it('the semi-finals stay two-legged with the single-match final on', () => {
    const rules = { ...RULES, singleMatchFinal: true };
    const results = playBracketTie(
      roundsOf(8),
      ROUND_1,
      'p1.r2.t1',
      rules,
      ovrOf,
      createSeededRng(1)
    );
    expect(results.find((result) => result.tieId === 'p1.r2.t1')?.matches[1].part).toBe(
      'leg2'
    );
  });

  it('is deterministic: the same seed gives the same results', () => {
    const rounds = roundsOf(8);
    expect(
      playBracketTie(rounds, [], 'p1.r1.t1', RULES, ovrOf, createSeededRng(4))
    ).toEqual(playBracketTie(rounds, [], 'p1.r1.t1', RULES, ovrOf, createSeededRng(4)));
  });

  it('a re-scorinate clears the dependent ties, then replaces the result (US-04.6)', () => {
    const rounds = roundsOf(8, true);
    const full = [
      ...ROUND_1,
      won('p1.r2.t1', 's4', 's8'),
      won('p1.r2.t2', 's3', 's2'),
      won('p1.r3.third', 's8', 's2'),
      won('p1.r3.final', 's4', 's3'),
    ];
    const results = playBracketTie(
      rounds,
      full,
      'p1.r1.t1',
      RULES,
      ovrOf,
      createSeededRng(2)
    );
    expect(idsOf(results)).toEqual(
      ['p1.r1.t1', 'p1.r1.t2', 'p1.r1.t3', 'p1.r1.t4', 'p1.r2.t2'].sort()
    );
    expect(results.find((result) => result.tieId === 'p1.r1.t1')).not.toEqual(
      ROUND_1[0]
    );
  });

  it('does not change its input list', () => {
    const results = ROUND_1.slice();
    playBracketTie(roundsOf(8), results, 'p1.r1.t1', RULES, ovrOf, createSeededRng(2));
    expect(results).toEqual(ROUND_1);
  });

  it.each([
    ['a bye tie', 6, 'p1.r1.t1'],
    ['a tie with a TBD team', 8, 'p1.r2.t1'],
    ['a tie that is not in the tree', 8, 'p1.r1.t9'],
  ])('throws a RangeError for %s', (_, n, tieId) => {
    expect(() =>
      playBracketTie(roundsOf(n), [], tieId, RULES, ovrOf, createSeededRng(1))
    ).toThrow(RangeError);
  });
});

describe('playBracketRound (US-04.5)', () => {
  it('plays every playable tie, and only those', () => {
    const rounds = roundsOf(8, true);
    const first = playBracketRound(rounds, [], RULES, ovrOf, createSeededRng(1));
    expect(idsOf(first)).toEqual(['p1.r1.t1', 'p1.r1.t2', 'p1.r1.t3', 'p1.r1.t4']);
    const second = playBracketRound(rounds, first, RULES, ovrOf, createSeededRng(2));
    expect(idsOf(second)).toEqual([...idsOf(first), 'p1.r2.t1', 'p1.r2.t2'].sort());
    const third = playBracketRound(rounds, second, RULES, ovrOf, createSeededRng(3));
    expect(isBracketComplete(rounds, third)).toBe(true);
    expect(playBracketRound(rounds, third, RULES, ovrOf, createSeededRng(4))).toEqual(
      third
    );
  });

  it('plays the ties in tree order, so it equals one playBracketTie after the other', () => {
    const rounds = roundsOf(8);
    const rng = createSeededRng(6);
    let expected: BracketTieResult<string>[] = [];
    for (const tieId of findPlayableTies(rounds, [])) {
      expected = playBracketTie(rounds, expected, tieId, RULES, ovrOf, rng);
    }
    expect(playBracketRound(rounds, [], RULES, ovrOf, createSeededRng(6))).toEqual(
      expected
    );
  });

  it('6 qualifiers: skips the byes', () => {
    const results = playBracketRound(roundsOf(6), [], RULES, ovrOf, createSeededRng(1));
    expect(idsOf(results)).toEqual(['p1.r1.t2', 'p1.r1.t4']);
  });
});

describe('the clear (US-04.6, US-04.7)', () => {
  it('from the first round: its semi-final, the third-place tie, and the final', () => {
    expect(findDependentTies(roundsOf(8, true), 'p1.r1.t1')).toEqual([
      'p1.r2.t1',
      'p1.r3.third',
      'p1.r3.final',
    ]);
  });

  it('from a semi-final: the third-place tie and the final', () => {
    expect(findDependentTies(roundsOf(8, true), 'p1.r2.t2')).toEqual([
      'p1.r3.third',
      'p1.r3.final',
    ]);
  });

  it('from a tie next to a bye: the tie of the bye team, then on', () => {
    expect(findDependentTies(roundsOf(6), 'p1.r1.t2')).toEqual([
      'p1.r2.t1',
      'p1.r3.final',
    ]);
  });

  it('the final has no dependent ties', () => {
    expect(findDependentTies(roundsOf(8, true), 'p1.r3.final')).toEqual([]);
  });

  it('hasDependentResults says when the confirm must open', () => {
    const rounds = roundsOf(8);
    expect(hasDependentResults(rounds, ROUND_1, 'p1.r1.t1')).toBe(false);
    const results = [...ROUND_1, won('p1.r2.t1', 's4', 's8')];
    expect(hasDependentResults(rounds, results, 'p1.r1.t1')).toBe(true);
    expect(hasDependentResults(rounds, results, 'p1.r1.t3')).toBe(false);
  });

  it('a cleared tie with both teams known is playable again', () => {
    const rounds = roundsOf(8);
    const results = [...ROUND_1, won('p1.r2.t1', 's4', 's8')];
    const after = playBracketTie(
      rounds,
      results,
      'p1.r1.t2',
      RULES,
      ovrOf,
      createSeededRng(5)
    );
    expect(findPlayableTies(rounds, after)).toContain('p1.r2.t1');
    expect(findTieTeams(rounds, after, 'p1.r2.t1')[1]).toMatchObject({ kind: 'team' });
  });
});

describe('completion (US-04.12, US-04.14)', () => {
  it('findCurrentRound gives the earliest round with a tie and no result', () => {
    const rounds = roundsOf(8, true);
    expect(findCurrentRound(rounds, [])).toBe(1);
    expect(findCurrentRound(rounds, ROUND_1.slice(0, 3))).toBe(1);
    expect(findCurrentRound(rounds, ROUND_1)).toBe(2);
  });

  it('a bye tie never holds the current round back', () => {
    const rounds = roundsOf(6);
    const results = [won('p1.r1.t2', 's4', 's5'), won('p1.r1.t4', 's3', 's6')];
    expect(findCurrentRound(rounds, results)).toBe(2);
  });

  it('the phase is complete with the final and the third-place tie played', () => {
    const rounds = roundsOf(4, true);
    const semis = [won('p1.r1.t1', 's1', 's4'), won('p1.r1.t2', 's2', 's3')];
    const withFinal = [...semis, won('p1.r2.final', 's2', 's1')];
    expect(isBracketComplete(rounds, withFinal)).toBe(false);
    expect(findBracketWinner(rounds, withFinal)).toBeUndefined();
    expect(findCurrentRound(rounds, withFinal)).toBe(2);
    const all = [...withFinal, won('p1.r2.third', 's4', 's3')];
    expect(isBracketComplete(rounds, all)).toBe(true);
    expect(findBracketWinner(rounds, all)).toBe('s2');
    expect(findCurrentRound(rounds, all)).toBeUndefined();
  });

  it('with no third-place tie, the final alone completes the phase', () => {
    const rounds = roundsOf(2);
    expect(isBracketComplete(rounds, [])).toBe(false);
    expect(findBracketWinner(rounds, [won('p1.r1.final', 's2', 's1')])).toBe('s2');
  });
});
