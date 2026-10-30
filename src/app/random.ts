import type { RandomBytes } from '@/engine/identity';
import { createSeededRng, type Rng } from '@/engine/rng';

/** The real random source for `uuidV4` (Task 103). The engine takes the
 * source as a parameter, so its tests stay reproducible (`ENGINE.md`). */
export const cryptoRandomBytes: RandomBytes = (length) =>
  crypto.getRandomValues(new Uint8Array(length));

/** A fresh, non-deterministic seed for each call. The engine itself takes a
 * deterministic `Rng` (`ENGINE.md`), so the randomness lives here. */
export function freshSeed(): number {
  return Math.floor(Math.random() * 0xffffffff);
}

/** An engine `Rng` with a fresh seed, for an app action that rolls. */
export function freshRng(): Rng {
  return createSeededRng(freshSeed());
}
