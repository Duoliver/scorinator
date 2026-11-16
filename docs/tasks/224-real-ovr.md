# Task 224: the real OVR function

**Status:** Refactor

## Goal

One pure function in `engine/tier-ovr` gives the real OVR of a team from its base OVR and its condition level (US-14.1). Tasks 226 and 228 use it later. It has no caller in this task.

## Acceptance criteria

- [x] Each level gives its fixed percentage of the base OVR, with its rounding (US-14.1): +2 is +20%, rounded up. +1 is +10%, rounded up. 0 gives the base OVR. -1 is -10%, rounded down. -2 is -20%, rounded down.
- [x] The story examples pass: a base OVR of 35 gives 39 at +1, and 31 at -1.
- [x] The function uses integer arithmetic. A base OVR of 50 at +1 gives 55, not 56.
- [x] The tests cover each level at both ends of each Tier range (US-14.1).
- [x] The real OVR can go out of the Tier range: 99 at +2 gives 119, and 30 at -2 gives 24.
- [x] The function takes no RNG. The same inputs always give the same result.
- [x] The level set and its check live beside the function, in `engine/tier-ovr`, and the module index exports them.
- [x] Lint, the format check, the type check, and the full suite pass.

## Notes

- **2026-11-16:** Started. Inputs: US-14.1, the Task 205 module question Q1 (the function goes in `engine/tier-ovr`, next to the OVR roll), `docs/coding-standards.md`, and `src/engine/ENGINE.md`.
- **2026-11-16:** The user agreed the criteria and five choices: (1) `applyCondition(baseOvr, level)`. (2) A `ConditionLevel` type of -2 to 2, with `CONDITION_LEVELS` and `isConditionLevel`, as `TIER_ORDER` and `isTier`. (3) A new `condition.ts` in `engine/tier-ovr`. (4) Multiply first, then one division by 100. (5) A `RangeError` for a bad base OVR or an unknown level.
- **2026-11-16:** Tests first: 26 of 27 new tests failed before the code. The export guard of `tierOvr.test.ts` ("no direct setter") lists each export of the module. Claude added the three new names, with a comment: the real OVR is a match value, and it does not set the base OVR.
- **2026-11-16:** The user agreed the review. Commit 1, then the refactor pass.

## Report

- **What was built:** `applyCondition(baseOvr, level)` in `src/engine/tier-ovr/condition.ts`. It gives the base OVR plus the percentage of the level, rounded up for a positive level and down for a negative level. `CONDITION_LEVELS`, `isConditionLevel`, and the `ConditionLevel` type sit beside it. The module index exports them. No caller yet: Task 226 uses it for scorination, and Task 225 uses the check to read files.
- **Test approach:** 27 unit tests in `condition.test.ts`. A table of the 14 Tier range ends at each of the five levels, worked out by hand, and a test that the table covers each range end. The story examples, the rounding of each sign, the whole-percentage cases (50 at +1 is 55), out of range results, a base OVR of 0, and the errors. The export guard test of `tierOvr.test.ts` lists the new names. Full suite: 2363 tests pass. Lint, the format check, and the type check pass.
- **Decisions made:** the five choices above. They are in the `PROGRESS.md` Decisions log.
- **What is left, what is next:** Task 225 (the condition data) depends on this task.
- **Refactor:** waits for the review.
