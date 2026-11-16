export const Tier = { S: 'S', A: 'A', B: 'B', C: 'C', D: 'D', E: 'E', F: 'F' } as const;
export type Tier = (typeof Tier)[keyof typeof Tier];

export interface TierOvrRange {
  min: number;
  max: number;
}

/** A condition level of a team in one league (US-14.1): -2 is a crisis,
 * +2 a peak, 0 the default. */
export type ConditionLevel = -2 | -1 | 0 | 1 | 2;
