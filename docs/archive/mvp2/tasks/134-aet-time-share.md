# Task 134: AET, a time share of the match, with the bands

**Status:** Done (2026-11-03)

## Goal

Give the engine a way to simulate 30 minutes of extra time (AET) after a drawn match. AET uses the expected goals of the full match × 1/3, with the same elasticity as the match (Task 80). The bracket tasks (135, 137) call it. This task adds no screen and no stored data.

Stories: US-03.1, the engine rows only (rows 4 and 10). The toggle, the venue choice, the score display, and away goals belong to later tasks (see Out of scope).

## Acceptance criteria

- [x] Before any change, a test pins the `scorinateMatch` score for a few fixed seeds. The test still passes after the change, so stored leagues and seeded tests keep the same results.
- [x] A new `scorinatePeriod(homeOvr, awayOvr, elasticity, timeShare, rng)` draws one Poisson score for each team, with expected goals = `computeExpectedGoals` × `timeShare`.
- [x] `scorinateMatch` becomes `rollElasticity` plus `scorinatePeriod` with a time share of 1. It makes the same RNG draws in the same order as before.
- [x] A new `AET_TIME_SHARE = 1/3` constant, and a new `scorinateExtraTime(homeOvr, awayOvr, elasticity, rng)` that calls `scorinatePeriod` with it. It returns the AET goals only, as a `MatchScore`.
- [x] The home boost stays with the caller, through `applyHomeAdvantage`, as for a full match. The engine function has no venue state.
- [x] Unit tests: the same seed gives the same AET score. AET goals are never negative. The AET expected goals are 1/3 of the full-match value for the same OVRs and elasticity.
- [x] Statistical tests stay inside the Task 80 bands. Only drawn matches go to AET, and each AET re-uses the elasticity of its match:
  - Equal teams at OVR 35, 65, and 95: 48% to 60% of AETs stay drawn.
  - Equal teams at OVR 35, 65, and 95: the mean AET goals are 0.65 to 0.95.
  - OVR 80 v 65: the stronger team wins 60% to 70% of decided AETs.
- [x] The module surface test lists the new exports.
- [x] Type check, lint, Prettier, and the full test suite pass.

## Out of scope

- The "Plays AET" toggle and the Review text (Task 140).
- The venue choice: neutral for a single match, the home boost for a second leg (Task 137 calls the engine with the right OVRs).
- Adding the AET goals to the match score, and the asterisk on the tie card (Tasks 137, 139, 141).
- Away goals, and the rule that AET goals are not away goals (Task 135).
- A replay and its AET (Task 135, US-03.2).

## Notes

- **2026-11-03:** Facts from the code. `scorinateMatch` (`src/engine/scorination/scorination.ts`) rolls the elasticity inside and does not return it. The bracket needs that value for the AET. Callers today: `app/state/leagueWrapperActions.ts` and `features/fixtures/`, through `playMatch`. `MatchScore` is `{ homeGoals, awayGoals }`.
- **2026-11-03:** The Task 80 bands come from regulation draws only. A drawn match has a lower elasticity on average, so the test must play the full match first and keep its elasticity. A test that rolls a new elasticity for the AET measures a different thing.
- **2026-11-03:** Proposed choices, for the user to agree before the work starts:

  | # | Choice | Effect | Undo cost |
  |---|---|---|---|
  | 1 | The bracket rolls the elasticity with `rollElasticity`, then calls `scorinatePeriod` for the 90 minutes and `scorinateExtraTime` for the AET. `scorinateMatch` and `playMatch` keep their signatures. | No change for the current callers. | Low |
  | 2 ⚠ | `scorinateMatch` keeps the same RNG draw order, with a pinned-score test before the change. | Stored seeded results and the M1 to M3 tests stay the same. A different order changes no stored score, but it changes the next seeded run. | Low now, high after Task 137 |
  | 3 | `scorinateExtraTime` returns the AET goals only. The bracket adds them to the match score and records that AET was played. | The tie record can show "* score includes AET" later. | Low |
  | 4 | The home boost stays with the caller, as for `playMatch`. No `homeAdvantage` flag on the AET function. | Task 137 picks the OVRs for the venue. | Low |
  | 5 | Each statistical case runs until it has 10,000 AETs, from one fixed seed. The bands are the Task 80 bands, with no new numbers. | The test is stable and takes about 1 second. | Low |

- **2026-11-03:** The user agreed the criteria and choices 1 to 5. The user parked a display of the score before AET as `scorinator-future-features.md` §22. Task 139 must keep both scores in the tie record, or §22 needs a data change later.

## Report

- **What was built:** `engine/scorination` has a new core `scorinatePeriod(homeOvr, awayOvr, elasticity, timeShare, rng)`, a new `AET_TIME_SHARE = 1/3`, and a new `scorinateExtraTime(homeOvr, awayOvr, elasticity, rng)` that returns the AET goals only. `scorinateMatch` now calls `rollElasticity` and `scorinatePeriod`, with the same RNG draws in the same order. No caller uses the AET function yet. Task 137 is the first.
- **Test approach:** 14 new unit and statistical tests in `scorination.test.ts`, 1338 tests in total.
  - A pinned-score test, written and green before the change: 4 seeds × 5 matches of `scorinateMatch`. It stays green after the change.
  - Unit tests: `scorinatePeriod` with a share of 1 equals `scorinateMatch`. The mean goals scale with the share. The AET is deterministic, never negative, and equals `scorinatePeriod` with the AET share.
  - Statistical tests, 10,000 AETs for each case, seed 134. Only drawn matches go to AET, with the elasticity of the match. Measured values, all inside the Task 80 bands:

  | Case | AET stays drawn (48% to 60%) | Mean AET goals (0.65 to 0.95) | Stronger team wins a decided AET (60% to 70%) |
  |---|---|---|---|
  | OVR 35 v 35 | 56.6% | 0.73 | not tested |
  | OVR 65 v 65 | 54.1% | 0.81 | not tested |
  | OVR 95 v 95 | 52.1% | 0.87 | not tested |
  | OVR 80 v 65 | not tested | not tested | 65.3% |

  - Not tested here on purpose: the venue and the home boost of a second-leg AET. The engine function takes the OVRs as given, and Task 137 picks them.
- **Decisions made:** choices 1 to 5 above, in the `PROGRESS.md` Decisions log on 2026-11-03. The user parked the score before AET as `scorinator-future-features.md` §22.
- **What is left, what is next:**
  - Task 137 must keep the match score and the AET goals apart in the tie record, so §22 needs no data change later.
  - The floor of 0.05 expected goals applies before the time share, so an AET floor is about 0.017. A heavy mismatch can still score in AET, but rarely.
  - Next: Task 135 (penalties, the coin toss, the four sequences, away goals).
