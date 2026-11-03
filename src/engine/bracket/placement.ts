import type { Rng } from '@/engine/rng';
import type { BracketTiePosition } from './types';

function isPowerOfTwo(value: number): boolean {
  return Number.isInteger(value) && value >= 2 && (value & (value - 1)) === 0;
}

/**
 * The slots of a bracket: the next power of 2 from the qualifier count
 * (spec §1 Bracket Sizing & Byes). 6 qualifiers give 8 slots, so 2 byes.
 *
 * Throws a `RangeError` for fewer than 2 qualifiers, or a count that is not
 * a whole number.
 */
export function bracketSlotCount(qualifiers: number): number {
  if (!Number.isInteger(qualifiers) || qualifiers < 2) {
    throw new RangeError(`A bracket needs 2 qualifiers or more. It got ${qualifiers}.`);
  }
  let slots = 2;
  while (slots < qualifiers) slots *= 2;
  return slots;
}

/**
 * The seed of each slot, top to bottom, by the standard bracket placement
 * (US-04.2): seeds 1 and 2 can meet only in the final, seeds 1 to 4 only
 * from the semi-finals on, and so on. Slots 2k and 2k + 1 make one
 * first-round tie: 8 slots give 1 v 8, 4 v 5, 2 v 7, 3 v 6.
 *
 * Each step doubles the bracket: a seed s gets the opponent that adds up to
 * the new slot count plus 1.
 *
 * Throws a `RangeError` for a slot count that is not a power of 2 of 2 or
 * more.
 */
export function standardPlacement(slots: number): number[] {
  if (!isPowerOfTwo(slots)) {
    throw new RangeError(`A bracket needs a power of 2 of slots. It got ${slots}.`);
  }
  let placement = [1, 2];
  while (placement.length < slots) {
    const size = placement.length * 2;
    placement = placement.flatMap((seed) => [seed, size + 1 - seed]);
  }
  return placement;
}

/**
 * A random seed order for a bracket that is the first phase, for example a
 * pure cup (US-04.2). The caller stores the draw. The same seed of the
 * `Rng` gives the same draw. The input does not change.
 */
export function drawBracketSeeds<TeamId>(teams: readonly TeamId[], rng: Rng): TeamId[] {
  const seeds = teams.slice();
  for (let i = seeds.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [seeds[i], seeds[j]] = [seeds[j], seeds[i]];
  }
  return seeds;
}

/** The third-place tie (US-04.12, US-04.14). */
export const THIRD_PLACE_NAME = 'Third-place playoff';

/**
 * The name of a round, from the teams it can hold, byes included (US-04.14).
 * The screens and the text export share it, so it lives in the engine
 * (Task 136 choice 5).
 *
 * Throws a `RangeError` for a count that is not a power of 2 of 2 or more.
 */
export function roundName(teams: number): string {
  if (!isPowerOfTwo(teams)) {
    throw new RangeError(
      `A bracket round holds a power of 2 of teams. It got ${teams}.`
    );
  }
  if (teams === 2) return 'Final';
  if (teams === 4) return 'Semi-finals';
  if (teams === 8) return 'Quarter-finals';
  return `Round of ${teams}`;
}

/**
 * Builds the id of a bracket tie from its place in the league (Task 77):
 * `p{phase}.r{round}.t{tie}`, or `p{phase}.r{round}.final` for the final.
 * As for `fixtureId`, this is the only function that builds a tie id, and
 * no code parses one.
 *
 * Throws a `RangeError` if a number is not a whole number of 1 or more.
 */
export function bracketTieId(position: BracketTiePosition): string {
  const { phase, round, tie } = position;
  const numbers: [string, number][] = [
    ['phase', phase],
    ['round', round],
  ];
  if (tie !== 'final') numbers.push(['tie', tie]);
  for (const [field, value] of numbers) {
    if (!Number.isInteger(value) || value < 1) {
      throw new RangeError(
        `A tie id needs a whole number of 1 or more for "${field}". It got ${value}.`
      );
    }
  }
  return tie === 'final' ? `p${phase}.r${round}.final` : `p${phase}.r${round}.t${tie}`;
}
