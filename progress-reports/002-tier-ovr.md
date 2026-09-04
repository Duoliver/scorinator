# Task 2 — Tier→OVR range mapping + roll logic

**Status:** Done — 2026-09-04

## What was built

`src/engine/tier-ovr/` now holds the Tier to OVR mapping and roll logic:

- `types.ts`: the `Tier` union (`S`/`A`/`B`/`C`/`D`/`E`/`F`) and a `TierOvrRange` shape (`min`, `max`).
- `tierOvr.ts`: `TIER_ORDER`, the `TIER_OVR_RANGES` table, and `rollOVR(tier, rng)`, the one function that produces an OVR value.
- `index.ts`: a barrel that re-exports exactly those three names, and nothing else.

This session also added `src/engine/rng.ts`. It holds a shared `Rng` type (`() => number`) and `createSeededRng(seed)`, a small deterministic generator (mulberry32). ENGINE.md requires an injected RNG for every stochastic engine decision. `tier-ovr` is the first module that needs one. Later engine modules, such as `scorination` and `identity`, can reuse this file, instead of each one defining its own RNG type.

## Test approach

Unit tests only, per the `engine/` row in the layer table of `tdd.md`. `rng.test.ts` checks three things. Every draw stays in `[0, 1)`. The same seed gives the same sequence. Different seeds give different sequences.

`tierOvr.test.ts` follows the five test cases from the Task 2 section of `mvp1-first-tasks.md`:

1. Range table: S is 90-99. Each tier's range sits fully below the tier above it. No two ranges overlap.
2. `rollOVR` stays inside the range of the rolled tier, checked across 200 seeds for each of the 7 tiers.
3. `rollOVR` is deterministic. The same seed produces the same roll.
4. Rolling for a new tier, after a tier change, lands in the range of the new tier, not the old one.
5. The public surface of the module exports only `TIER_ORDER`, `TIER_OVR_RANGES`, and `rollOVR`. No other export can set OVR directly.

10 new tests in total, and all pass, 104 across the suite. `npm run type-check` and `npm run lint` are both clean.

## Decisions made

- **Tier→OVR range table (open item, flagged per `tdd.md`):** the spec gives only one anchor, S = 90-99. It calls the rest a default, without a listed table. This session proposes seven even, non-overlapping 10-point bands, anchored on that value:

  | Tier | Range |
  |------|-------|
  | S | 90-99 |
  | A | 80-89 |
  | B | 70-79 |
  | C | 60-69 |
  | D | 50-59 |
  | E | 40-49 |
  | F | 30-39 |

  This is a balancing detail, not a spec value. It is the same kind of judgment call as the spacing scale in Task 0. If the user wants a different spread, `TIER_OVR_RANGES` is the one place to change it. The range tests would then need matching updates.

- **Placed the shared `Rng` type at `engine/rng.ts`, not inside `tier-ovr/`.** ENGINE.md treats injected RNG as a rule that spans several future modules: `scorination`, `identity`, and, in MVP2, `bracket` and `tiebreak`. A cross-cutting type at the root of `engine/` stops `scorination` from importing an RNG type out of `tier-ovr`, a module it has no other reason to depend on. This is not new module scaffolding ahead of need. `tier-ovr` needs an RNG contract now. This choice just gives that contract a home other modules can reuse later, once they exist.

- **No RNG injection for the Tier→OVR range table itself, only for the roll.** The ranges form a fixed constant table, not a stochastic decision, so they need no RNG.

## What is left, what is next

- The "immediate re-roll on Tier change" trigger sits out of scope here. The MVP1 spec ties it to Story Mode Tier Shift, an MVP4 feature, per `mvp1-first-tasks.md`. `rollOVR(tier, rng)` exists as a pure function, callable whenever a caller needs it. This task built no event system to call it automatically.
- No `Team` entity exists yet in `engine/` or in `persistence/`. This task works only with a bare `Tier` value, not a team record. Wiring `rollOVR` into the season-start or tier-change flow of an actual team is downstream work, likely in `persistence/` or `features/`, once those exist.
- Task 3, round-robin fixture generation, is next, per the status board.
