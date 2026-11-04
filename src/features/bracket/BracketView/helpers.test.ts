import { describe, expect, it } from 'vitest';
import { DEFAULT_BRACKET_RULES, type PhasePlan } from '@/engine/phases';
import type {
  BracketRules,
  BracketTie,
  BracketTieResult,
  TieSide,
} from '@/engine/bracket';
import {
  buildTieCard,
  describeBracketHeader,
  describeMethod,
  TBD_COLOUR,
} from './helpers';

const RULES: BracketRules = { ...DEFAULT_BRACKET_RULES, homeAdvantage: false };
const lookup = (id: string): { name: string; colour: string } => ({
  name: id.toUpperCase(),
  colour: `#${id}`,
});

describe('describeMethod (Task 141 choice 7)', () => {
  it.each([
    [true, 'penalties', 'AET → Penalties'],
    [false, 'penalties', 'Penalties'],
    [true, 'replay-coin-toss', 'AET → Replay → Coin toss'],
    [false, 'replay-coin-toss', 'Replay → Coin toss'],
  ] as const)('AET %s, %s: %s', (playsAet, method, text) => {
    expect(describeMethod({ ...RULES, playsAet, method })).toBe(text);
  });
});

describe('describeBracketHeader (US-04.2, Task 141 choice 8)', () => {
  const plans: PhasePlan[] = [
    {
      format: 'groups',
      legs: 'two-way',
      grouping: { by: 'size', size: 4 },
      advance: { top: 2, bestOfNext: 0 },
    },
    { format: 'bracket' },
  ];

  it('a later bracket: seeded by the phase before, two legs, the AET footnote', () => {
    expect(describeBracketHeader(plans, 1, { ...RULES, format: 'two-legged' })).toBe(
      'Seeded by Group Stage final standing · All ties two-legged (aggregate, home & away), away goals off · AET → Penalties · * leg score includes AET'
    );
  });

  it('a first-phase bracket: seeded by random draw, single match, no footnote with AET off', () => {
    expect(
      describeBracketHeader([{ format: 'bracket' }], 0, { ...RULES, playsAet: false })
    ).toBe('Seeded by random draw · All ties single match · Penalties');
  });

  it('a single match with AET says "score", not "leg score"', () => {
    expect(describeBracketHeader([{ format: 'bracket' }], 0, RULES)).toBe(
      'Seeded by random draw · All ties single match · AET → Penalties · * score includes AET'
    );
  });

  it('adds the single-match final and away goals on', () => {
    expect(
      describeBracketHeader(plans, 1, {
        ...RULES,
        format: 'two-legged',
        awayGoals: true,
        singleMatchFinal: true,
        playsAet: false,
      })
    ).toBe(
      'Seeded by Group Stage final standing · All ties two-legged (aggregate, home & away), away goals on · single-match final · Penalties'
    );
  });
});

describe('buildTieCard (US-04.8, US-04.7, US-04.11)', () => {
  const tie = (kind: BracketTie<string>['kind'] = 'regular'): BracketTie<string> => ({
    id: 'p1.r1.t1',
    round: 1,
    tie: 1,
    kind,
    slots: [
      { kind: 'team', teamId: 'a', seed: 1 },
      { kind: 'team', teamId: 'b', seed: 8 },
    ],
  });
  const sides: [TieSide<string>, TieSide<string>] = [
    { kind: 'team', teamId: 'a', seed: 1 },
    { kind: 'team', teamId: 'b', seed: 8 },
  ];
  const twoLegs = { ...RULES, format: 'two-legged' as const };

  it('a single match with no result: one empty column, no header, "Not played"', () => {
    const card = buildTieCard(tie(), sides, undefined, RULES, lookup, true);
    expect(card.columns).toEqual([]);
    expect(card.rows.map((row) => [row.name, row.scores, row.isWinner])).toEqual([
      ['A', [''], false],
      ['B', [''], false],
    ]);
    expect(card.footer).toBe('Not played');
    expect(card.canScorinate).toBe(true);
    expect(card.hasResult).toBe(false);
  });

  it('two legs with no result: two columns with the header "L1", "L2"', () => {
    const card = buildTieCard(tie(), sides, undefined, twoLegs, lookup, true);
    expect(card.columns).toEqual(['L1', 'L2']);
    expect(card.rows[0].scores).toEqual(['', '']);
  });

  it.each([
    ['final', 'Final'],
    ['third', 'Third-place playoff'],
    ['regular', undefined],
  ] as const)('a %s tie has the title %s (Task 188)', (kind, title) => {
    const card = buildTieCard(tie(kind), sides, undefined, RULES, lookup, true);
    expect(card.title).toBe(title);
  });

  it('a single-match final in a two-legged bracket has one column', () => {
    const card = buildTieCard(
      tie('final'),
      sides,
      undefined,
      { ...twoLegs, singleMatchFinal: true },
      lookup,
      true
    );
    expect(card.columns).toEqual([]);
  });

  it('two legs played: each team goals by leg, the aggregate, and the winner', () => {
    const result: BracketTieResult<string> = {
      tieId: 'p1.r1.t1',
      matches: [
        {
          part: 'leg1',
          homeId: 'b',
          awayId: 'a',
          score: { homeGoals: 1, awayGoals: 2 },
        },
        {
          part: 'leg2',
          homeId: 'a',
          awayId: 'b',
          score: { homeGoals: 1, awayGoals: 0 },
        },
      ],
      winnerId: 'a',
      loserId: 'b',
      decidedBy: 'regulation',
    };
    const card = buildTieCard(tie(), sides, result, twoLegs, lookup, false);
    expect(card.rows.map((row) => [row.scores, row.isWinner])).toEqual([
      [['2', '1'], true],
      [['1', '0'], false],
    ]);
    expect(card.footer).toBe('Agg 3–1');
    expect(card.hasResult).toBe(true);
    expect(card.canScorinate).toBe(true);
  });

  it('marks an AET score, counts AET in the aggregate, and tags the penalties top row first', () => {
    const result: BracketTieResult<string> = {
      tieId: 'p1.r1.t1',
      matches: [
        {
          part: 'leg1',
          homeId: 'b',
          awayId: 'a',
          score: { homeGoals: 1, awayGoals: 0 },
        },
        {
          part: 'leg2',
          homeId: 'a',
          awayId: 'b',
          score: { homeGoals: 1, awayGoals: 0 },
          aet: { homeGoals: 1, awayGoals: 1 },
        },
      ],
      penalties: { homeGoals: 4, awayGoals: 5 },
      winnerId: 'b',
      loserId: 'a',
      decidedBy: 'penalties',
    };
    const card = buildTieCard(tie(), sides, result, twoLegs, lookup, false);
    expect(card.rows.map((row) => row.scores)).toEqual([
      ['0', '2*'],
      ['1', '1*'],
    ]);
    expect(card.footer).toBe('Agg 2–2 · Pens 4-5');
    expect(card.rows[1].isWinner).toBe(true);
  });

  it('a replay adds a "Rep" column, and a coin toss tags the footer', () => {
    const result: BracketTieResult<string> = {
      tieId: 'p1.r1.t1',
      matches: [
        {
          part: 'leg1',
          homeId: 'a',
          awayId: 'b',
          score: { homeGoals: 0, awayGoals: 0 },
        },
        {
          part: 'replay',
          homeId: 'a',
          awayId: 'b',
          score: { homeGoals: 2, awayGoals: 2 },
        },
      ],
      winnerId: 'b',
      loserId: 'a',
      decidedBy: 'coin-toss',
    };
    const card = buildTieCard(tie(), sides, result, RULES, lookup, false);
    expect(card.columns).toEqual(['L1', 'Rep']);
    expect(card.rows.map((row) => row.scores)).toEqual([
      ['0', '2'],
      ['0', '2'],
    ]);
    expect(card.footer).toBe('Coin toss');
  });

  it('tags away goals after the aggregate', () => {
    const result: BracketTieResult<string> = {
      tieId: 'p1.r1.t1',
      matches: [
        {
          part: 'leg1',
          homeId: 'b',
          awayId: 'a',
          score: { homeGoals: 1, awayGoals: 1 },
        },
        {
          part: 'leg2',
          homeId: 'a',
          awayId: 'b',
          score: { homeGoals: 0, awayGoals: 0 },
        },
      ],
      winnerId: 'a',
      loserId: 'b',
      decidedBy: 'away-goals',
    };
    expect(buildTieCard(tie(), sides, result, twoLegs, lookup, false).footer).toBe(
      'Agg 1–1 · Away goals'
    );
  });

  it('a TBD side shows "TBD" in grey, and the tie cannot play', () => {
    const card = buildTieCard(
      tie(),
      [sides[0], { kind: 'tbd' }],
      undefined,
      RULES,
      lookup,
      false
    );
    expect(card.rows[1]).toMatchObject({
      name: 'TBD',
      colour: TBD_COLOUR,
      isTbd: true,
    });
    expect(card.canScorinate).toBe(false);
  });

  it('a bye tie is a bye card with its team, and cannot play', () => {
    const card = buildTieCard(
      tie(),
      [sides[0], { kind: 'bye' }],
      undefined,
      RULES,
      lookup,
      false
    );
    expect(card.isBye).toBe(true);
    expect(card.rows[0].name).toBe('A');
    expect(card.canScorinate).toBe(false);
  });

  it('names the third-place tie', () => {
    expect(
      buildTieCard(tie('third'), sides, undefined, RULES, lookup, true).title
    ).toBe('Third-place playoff');
    expect(
      buildTieCard(tie(), sides, undefined, RULES, lookup, true).title
    ).toBeUndefined();
  });
});
