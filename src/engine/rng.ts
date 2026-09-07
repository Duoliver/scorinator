/**
 * Shared RNG contract for `engine/`. Every stochastic function takes one of
 * these instead of calling `Math.random()` directly — see ENGINE.md.
 */
export type Rng = () => number;

/**
 * Deterministic RNG (mulberry32). Same seed always produces the same
 * sequence, which is what makes seeded engine tests reproducible.
 */
export function createSeededRng(seed: number): Rng {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
