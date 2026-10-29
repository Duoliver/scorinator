import type { RandomBytes } from '@/engine/identity';

/** The real random source for `uuidV4` (Task 103). The engine takes the
 * source as a parameter, so its tests stay reproducible (`ENGINE.md`). */
export const cryptoRandomBytes: RandomBytes = (length) =>
  crypto.getRandomValues(new Uint8Array(length));
