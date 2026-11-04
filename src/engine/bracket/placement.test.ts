import { describe, expect, it } from 'vitest';
import { createSeededRng } from '@/engine/rng';
import {
  THIRD_PLACE_NAME,
  bracketMatchId,
  bracketSlotCount,
  bracketTieId,
  drawBracketSeeds,
  roundName,
  standardPlacement,
} from './index';

const POWERS = [2, 4, 8, 16, 32, 64];

// The first-round ties of a placement, as "a v b" pairs.
function firstRound(slots: number): string[] {
  const placement = standardPlacement(slots);
  const ties: string[] = [];
  for (let i = 0; i < placement.length; i += 2) {
    ties.push(`${placement[i]} v ${placement[i + 1]}`);
  }
  return ties;
}

describe('bracketSlotCount', () => {
  it.each([
    [2, 2],
    [3, 4],
    [4, 4],
    [5, 8],
    [6, 8],
    [8, 8],
    [9, 16],
    [33, 64],
  ])('%i qualifiers give %i slots', (qualifiers, slots) => {
    expect(bracketSlotCount(qualifiers)).toBe(slots);
  });

  it.each([0, 1, 2.5, -4])('throws a RangeError for %d qualifiers', (qualifiers) => {
    expect(() => bracketSlotCount(qualifiers)).toThrow(RangeError);
  });
});

describe('standardPlacement (US-04.2)', () => {
  it.each([
    [2, ['1 v 2']],
    [4, ['1 v 4', '2 v 3']],
    [8, ['1 v 8', '4 v 5', '2 v 7', '3 v 6']],
    [
      16,
      ['1 v 16', '8 v 9', '4 v 13', '5 v 12', '2 v 15', '7 v 10', '3 v 14', '6 v 11'],
    ],
  ])('%i slots: the story table', (slots, ties) => {
    expect(firstRound(slots)).toEqual(ties);
  });

  it('32 slots: each tie adds up to 33, and the first ties follow the pattern', () => {
    const ties = firstRound(32);
    expect(ties.slice(0, 4)).toEqual(['1 v 32', '16 v 17', '8 v 25', '9 v 24']);
    for (const tie of ties) {
      const [a, b] = tie.split(' v ').map(Number);
      expect(a + b).toBe(33);
    }
  });

  it.each(POWERS)('%i slots: each seed shows once', (slots) => {
    expect([...standardPlacement(slots)].sort((a, b) => a - b)).toEqual(
      Array.from({ length: slots }, (_, i) => i + 1)
    );
  });

  it.each(POWERS)(
    '%i slots: seeds 1 to 2^m meet only in the last m rounds',
    (slots) => {
      const placement = standardPlacement(slots);
      const rounds = Math.log2(slots);
      const slotOf = (seed: number): number => placement.indexOf(seed);
      // Two slots meet in the first round r where they share a block of 2^r.
      const meetingRound = (a: number, b: number): number => {
        let round = 1;
        while (
          Math.floor(slotOf(a) / 2 ** round) !== Math.floor(slotOf(b) / 2 ** round)
        ) {
          round++;
        }
        return round;
      };
      for (let a = 1; a <= slots; a++) {
        for (let b = a + 1; b <= slots; b++) {
          const m = Math.ceil(Math.log2(b));
          expect(meetingRound(a, b)).toBeGreaterThanOrEqual(rounds - m + 1);
        }
      }
    }
  );

  it.each([0, 1, 3, 6, 12])('throws a RangeError for %i slots', (slots) => {
    expect(() => standardPlacement(slots)).toThrow(RangeError);
  });
});

describe('drawBracketSeeds (US-04.2, a first-phase bracket)', () => {
  const teams = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];

  it('gives each team once', () => {
    expect([...drawBracketSeeds(teams, createSeededRng(1))].sort()).toEqual(teams);
  });

  it('is deterministic: the same seed gives the same draw', () => {
    expect(drawBracketSeeds(teams, createSeededRng(4))).toEqual(
      drawBracketSeeds(teams, createSeededRng(4))
    );
  });

  it('draws different orders from different seeds', () => {
    const orders = new Set(
      Array.from({ length: 50 }, (_, seed) =>
        drawBracketSeeds(teams, createSeededRng(seed)).join('')
      )
    );
    expect(orders.size).toBeGreaterThan(40);
  });

  it('does not change its input', () => {
    const input = teams.slice();
    drawBracketSeeds(input, createSeededRng(2));
    expect(input).toEqual(teams);
  });
});

describe('roundName (US-04.14)', () => {
  it.each([
    [2, 'Final'],
    [4, 'Semi-finals'],
    [8, 'Quarter-finals'],
    [16, 'Round of 16'],
    [32, 'Round of 32'],
    [64, 'Round of 64'],
  ])('a round of %i teams is the "%s"', (teams, name) => {
    expect(roundName(teams)).toBe(name);
  });

  it('a bracket of 6 qualifiers starts with the Quarter-finals: byes count as slots', () => {
    expect(roundName(bracketSlotCount(6))).toBe('Quarter-finals');
  });

  it.each([0, 1, 3, 6])('throws a RangeError for %i teams', (teams) => {
    expect(() => roundName(teams)).toThrow(RangeError);
  });

  it('names the third-place tie', () => {
    expect(THIRD_PLACE_NAME).toBe('Third-place playoff');
  });
});

describe('bracketTieId (Task 77)', () => {
  it('builds p{phase}.r{round}.t{tie}', () => {
    expect(bracketTieId({ phase: 3, round: 2, tie: 1 })).toBe('p3.r2.t1');
  });

  it('builds p{phase}.r{round}.final for the final', () => {
    expect(bracketTieId({ phase: 3, round: 3, tie: 'final' })).toBe('p3.r3.final');
  });

  it('builds p{phase}.r{round}.third for the third-place tie', () => {
    expect(bracketTieId({ phase: 3, round: 3, tie: 'third' })).toBe('p3.r3.third');
  });

  it.each([
    { phase: 0, round: 1, tie: 1 },
    { phase: 1, round: 1.5, tie: 1 },
    { phase: 1, round: 1, tie: 0 },
  ])('throws a RangeError for %j', (position) => {
    expect(() => bracketTieId(position)).toThrow(RangeError);
  });
});

describe('bracketMatchId (Task 77)', () => {
  it('adds the match part to the tie id', () => {
    expect(bracketMatchId('p3.r2.t1', 'leg2')).toBe('p3.r2.t1.leg2');
    expect(bracketMatchId('p3.r3.final', 'replay')).toBe('p3.r3.final.replay');
  });
});
