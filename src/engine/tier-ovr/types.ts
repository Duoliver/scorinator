export const Tier = { S: 'S', A: 'A', B: 'B', C: 'C', D: 'D', E: 'E', F: 'F' } as const;
export type Tier = (typeof Tier)[keyof typeof Tier];

export interface TierOvrRange {
  min: number;
  max: number;
}
