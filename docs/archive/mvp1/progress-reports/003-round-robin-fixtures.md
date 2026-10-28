# Task 3 — Two-way round-robin fixture generation

**Status:** Done — 2026-09-04

## What was built

`src/engine/fixtures/` now holds the round-robin fixture generator:

- `types.ts`: `Fixture<TeamId>` (`matchday`, `home`, `away`), `Bye<TeamId>` (`matchday`, `team`), and `RoundRobinSchedule<TeamId>` (`fixtures`, `byes`).
- `roundRobin.ts`: `generateRoundRobin(teams)`, built on the standard round-robin circle method. It fixes one slot and rotates the rest each round. For an odd team count, it adds an internal bye placeholder, so the rotation still works on an even slot count.
- `index.ts`: a barrel for `generateRoundRobin` and the three types above.

The function takes `readonly TeamId[]`, a generic team identifier, not a `Team` domain object. No `Team` entity exists yet in `engine/` or in `persistence/`, the same gap the Task 2 report noted. A real team ID, string or UUID, can stand in for `TeamId` once that entity exists.

Fixture generation needs no RNG. Round-robin scheduling is not a stochastic decision, per the spec. So `generateRoundRobin` takes only the team list, no `Rng` parameter.

## Test approach

Unit tests only, per the `engine/` row in the layer table of `tdd.md`. `roundRobin.test.ts` follows the six test cases from the Task 3 section of `mvp1-first-tasks.md`:

1. For an even team count, every team plays every other team exactly once at home and once away. Checked for all ordered pairs.
2. No team appears twice within one matchday. Checked by grouping fixtures and byes per matchday. Every team appears exactly once.
3. For an odd team count, each matchday has exactly one bye. Every team ends up with the same total bye count across the full schedule.
4. Total match count equals `N × (N-1)`, checked for N from 2 through 7, even and odd.
5. The minimal case, N = 2, produces exactly one matchday each way, with no byes.
6. The same team list and order gives the same schedule on a second call. Generation uses no RNG.

7 new tests, and all pass, 111 total across the suite. `npm run type-check` and `npm run lint` are both clean.

## Decisions made

- **Rejects fewer than 2 teams (open item, flagged per `tdd.md` and `mvp1-first-tasks.md`).** The spec does not say what N = 0 or N = 1 should do. This session chose to throw a `RangeError` in both cases, rather than return an empty or degenerate schedule. The reason: a round robin with fewer than 2 teams cannot produce a single match. A quiet empty schedule risks masking a real caller bug, such as a league created with no teams added yet. If the user wants a silent empty-schedule fallback instead, this is the one guard to change.

- **Home and away alternates by round, not fixed to one slot.** Nothing in the spec requires a particular home and away spread within a single leg, only that each pairing happen once at home and once away, across the full season. The fixed anchor slot in the circle method would otherwise sit home every round of leg one. This session flips which side of the pairing is home based on round parity. This way, no team is home every round in either leg. This is an implementation detail, not a test-driven requirement. No test locks in the exact alternation pattern.

- **The odd-team bye uses an internal placeholder, `Symbol('bye')`, never exposed to the caller.** The schedule the caller sees only has real team IDs, in `fixtures` or in `byes`. This keeps the bye mechanism an implementation detail of the circle method, not a leak into the public `TeamId` type.

## What is left, what is next

- Single-duels round robin, the randomized-but-balanced home and away assignment for group play in MVP2, sits out of scope here. This session did not generalize `generateRoundRobin` toward it. Once the MVP2 task starts, it should decide whether that needs a new generator, or an extension of this one.
- No wiring into `persistence/` or `features/` yet. This task is the pure fixture-generation function only, the same scope boundary as `rollOVR` in Task 2.
- Task 4, standings calculation, is next, per the status board.
