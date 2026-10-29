/** A source of random bytes: it returns `length` new bytes on each call.
 * `uuidV4` takes one of these instead of calling `crypto` itself, so a test
 * can give fixed bytes (`ENGINE.md`). The app gives `crypto.getRandomValues`.
 * Not the engine `Rng`: its seeded form has 32 bits of state, too few for an
 * identity that must stay unique across installations (Task 103). */
export type RandomBytes = (length: number) => Uint8Array;
