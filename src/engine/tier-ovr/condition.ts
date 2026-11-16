import type { ConditionLevel } from './types';

/** The condition levels, from the crisis to the peak (US-14.1). */
export const CONDITION_LEVELS: readonly ConditionLevel[] = [-2, -1, 0, 1, 2];

/** The percentage of the base OVR that each level adds or takes away
 * (US-14.1, Task 203). */
const CONDITION_PERCENT: Readonly<Record<ConditionLevel, number>> = {
  [-2]: -20,
  [-1]: -10,
  0: 0,
  1: 10,
  2: 20,
};

/** True for one of the five condition levels. A file reader uses it. */
export function isConditionLevel(value: unknown): value is ConditionLevel {
  return (CONDITION_LEVELS as readonly unknown[]).includes(value);
}

/**
 * Gives the real OVR of a team: its base OVR plus the amount of its
 * condition level (US-14.1). A positive level rounds up, and a negative
 * level rounds down. The result can go out of the Tier range.
 *
 * The product is a whole number, and one division by 100 follows it. In
 * floating point, 50 × 1.1 is 55.00000000000001, and a round up gives 56.
 * A whole number divided by 100 is never that close to the next whole
 * number, so the round is exact.
 *
 * Throws a `RangeError` for a base OVR that is not a whole number of 0 or
 * more, or for an unknown level.
 */
export function applyCondition(baseOvr: number, level: ConditionLevel): number {
  if (!Number.isInteger(baseOvr) || baseOvr < 0) {
    throw new RangeError(
      `The base OVR must be a whole number of 0 or more. It got ${baseOvr}.`
    );
  }
  if (!isConditionLevel(level)) {
    throw new RangeError(`The condition level must be -2 to 2. It got ${level}.`);
  }
  const scaled = (baseOvr * (100 + CONDITION_PERCENT[level])) / 100;
  return level > 0 ? Math.ceil(scaled) : Math.floor(scaled);
}
