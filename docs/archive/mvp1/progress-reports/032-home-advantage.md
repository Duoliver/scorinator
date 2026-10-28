# Task 32 — Stronger home advantage: a flat part plus a percentage part

**Status:** Done — 2026-10-05 (review closed by the user)

## What was built

`engine/scorination` replaces `HOME_ADVANTAGE_BOOST` (5%) with two constants: `HOME_ADVANTAGE_FLAT = 5` and `HOME_ADVANTAGE_PERCENT = 0.05`. `applyHomeAdvantage(ovr)` now returns `round(ovr * 1.05) + 5`, for example 65 becomes 73. Its signature did not change, so `leagueStore` (scorinate and re-scorinate) and the playground needed no change. Both specs describe the new rule: MVP1 §1 in full, and MVP2 §2 points to it.

## Measured effect

Two equal teams, home advantage on, 200,000 seeded matches each:

| OVR | Home win | Draw | Away win | Win gap |
|---|---|---|---|---|
| 35 | 42.0% | 29.3% | 28.7% | +13.2 |
| 65 | 44.1% | 27.6% | 28.3% | +15.8 |
| 95 | 47.3% | 25.9% | 26.8% | +20.6 |

Before this task, the gap at OVR 65 was +5.9. Real football is about +16 (approximate, from memory).

## Test approach

- Unit tests: the formula for 6 OVR values, the fixed examples (35 → 42, 65 → 73, 80 → 89, 99 → 109), and "never lowers an OVR". The module surface test lists the two new constants.
- Statistical tests: the win gap at OVR 35, 65, and 95, over 20,000 seeded matches each, must stay within ±2.5 points of the targets (+13.2, +15.9, +20.7). These replace the old test, which only checked that the boost raises the home win rate.

`type-check` and `lint` are clean. The full suite passes: 554 tests in 54 files (551 before).

## Decisions made

The values, the formula order, and the spec updates came from the user on 2026-10-05. See the Decisions log in `PROGRESS.md`.

## What is left, what is next

- The open extreme-scores issue (Open questions in `PROGRESS.md`) can change the OVR scale. If it does, retune these two values and the test targets.
- The draw rate stays about 28% at OVR 65, above the real ~25%. Not in this task, as the row says.
- A league already in progress uses the new boost from its next scorinated match. Results already played do not change.
