# Task 5 — Scorination: OVR diff + absolute OVR + elasticity → Poisson score

**Status:** Done — 2026-09-07

## What was built

`src/engine/scorination/` now holds match-score generation.

- `types.ts`: `MatchScore` (`homeGoals`, `awayGoals`).
- `scorination.ts`: the constants (`BASE_GOALS_PER_TEAM`, `REFERENCE_OVR`, `DIFF_WEIGHT`, `ABS_WEIGHT`, `ELASTICITY_MIN`, `ELASTICITY_MAX`). Also `rollElasticity(rng)`, `computeExpectedGoals(ownOvr, opponentOvr, elasticity)`, and `scorinateMatch(homeOvr, awayOvr, rng)`.
- `index.ts`: a barrel. It re-exports exactly those names.

`scorinateMatch` rolls one elasticity value per match. It computes an expected-goals value (a Poisson mean) for each side, from `computeExpectedGoals`. It then draws each side's goals from an independent Poisson distribution, via Knuth's algorithm. Home advantage (Task 6) sits out of scope. A league with it enabled should pass an already-boosted `homeOvr` in.

## Test approach

Two layers, per `ENGINE.md`'s split for this module.

**Unit tests** cover `computeExpectedGoals` and `rollElasticity`. Both are pure and bounded, so exact-value assertions apply here. Cases: the baseline value at an even, reference-OVR matchup. Linear scaling with elasticity. OVR difference moving expected goals up or down. The 5:1 weight ratio giving absolute OVR a visibly smaller pull than a same-size difference gap. The clamps holding under extreme inputs.

**Statistical tests** cover `scorinateMatch`, over 3,000 seeded trials each. `ENGINE.md` says not to assert exact scorelines here, so each test checks a threshold or a band instead. A large OVR gap (95 vs. 32) gives the favored team a win rate above 85 percent. The underdog still wins at least once in the sample. An even mid-tier matchup (65 vs. 65) averages between 1.0 and 1.6 goals per team. This brackets the spec's roughly 1.3 baseline. Two evenly matched pairs at different tiers (95 vs. 95, and 35 vs. 35) land within 1.0 combined goal of each other. This backs the spec's claim that elasticity, not tier, is what opens a game up. A 100-seed spot check confirms the same fixture produces more than one distinct combined score. This shows elasticity actually varies the result from match to match.

Left untested on purpose: exact scoreline probabilities. The spec calls this a "weighted-probability outcome," not a formula to pin down. Also left out: any interaction with home advantage, since that module does not exist yet (Task 6).

## Decisions made

- **OVR-difference vs. absolute-OVR weight ratio (CLAUDE.md open item, section 6):** This session proposed a concrete formula and stopped for the user's decision. CLAUDE.md names this exact item, so it got a direct question instead of the general "propose and flag" pattern used for ordinary balancing details. The session presented three ratio options, plus a custom option. The user picked the proposed 5:1 ratio: `DIFF_WEIGHT = 1.5`, `ABS_WEIGHT = 0.3`. See the Decisions log entry in `PROGRESS.md`.
- **`REFERENCE_OVR = 65`** is the midpoint of the Tier-OVR span (`engine/tier-ovr`). Absolute OVR is measured against this point. This is an ordinary balancing detail, not the flagged item. This session decided and documented it the way Task 2 picked the Tier-OVR bands.
- **Elasticity range `[0.4, 1.6]`, uniform, mean 1.0:** This keeps the league-wide average untouched by elasticity alone. Only the spread of one match changes. The range gives enough room for a shutout-to-shootout swing across many matches. Same balancing-detail treatment as above.
- **Clamp bounds** (`diffFactor` in `[0.15, 4]`, `absFactor` in `[0.5, 2]`): These guard against a mismatch driving expected goals to zero or below, or to an implausible extreme. They also guard a future caller that passes an out-of-range OVR. The underdog still keeps a nonzero chance under the clamp.
- **No RNG for `computeExpectedGoals`:** It is a pure function of already-rolled inputs (OVR, elasticity). It is not itself a stochastic decision. This matches the reasoning Task 2 used for the Tier-OVR range table, versus `rollOVR`.

## What is left, what is next

- Home advantage (Task 6) is next, per the status board. It applies a percentage OVR boost to `homeOvr`, before that value reaches `scorinateMatch`. It needs no change to this module's own logic.
- Re-scorination (Task 7) will call `scorinateMatch` again and overwrite the prior result. This layer needs no cascading logic for MVP1 round-robin play.
- No `Team` or `Match` entity exists yet. This module works only with bare OVR numbers, the same shape `engine/tier-ovr` and `engine/standings` use. Wiring it to real team or fixture records is downstream `features/` or `persistence/` work.
