# Task 116: the OVR override range check, and the roll on a Tier change

**Status:** Done

## Goal

Build the two pure OVR rules of Task 81 in `engine/tier-ovr`, so that the Edit drawer of the wizard (Task 121) uses one set of rules. An OVR override must stay inside the Tier range. A Tier change rolls a new OVR from the new Tier. No screen uses the rules in this task.

## Acceptance criteria

The user agreed these criteria and the four choices below on 2026-10-30.

**The range check:**

- [x] A function tells if an OVR value is valid for a Tier: a whole number from the Tier minimum to the Tier maximum, both included. For Tier C, 60 and 69 are valid, 59 and 70 are not.
- [x] A decimal, `NaN`, and `Infinity` are not valid.

**The roll on a Tier change:**

- [x] A function takes the current Tier and OVR, the new Tier, and an `Rng`. It gives the OVR after the change.
- [x] A different Tier gives a new OVR rolled from the new Tier range, as `rollOVR` does.
- [x] The same Tier keeps the current OVR, and does not use the `Rng`.
- [x] The same seed gives the same result.

**Code:**

- [x] The functions are in `engine/tier-ovr`, with no import from outside `engine/`.
- [x] The `rollOVR` doc comment and the "only exported way" test say what the module exports now: the roll, the check, and the roll on a Tier change. There is still no OVR setter.
- [x] Unit tests for each rule: both range ends for each Tier, one step outside each end, a decimal, `NaN`, a new Tier, the same Tier, and the same seed.
- [x] `npm run lint`, `npm run format:check`, `npm run type-check`, and `npm test` pass.

**Out of scope:** the Edit drawer, its OVR field, and the range text (Task 121). "Reset to original", which rolls from the Blueprint Tier with `rollOVR` (Task 121). The roll at add (Task 120). The CSV and the file parsers: an Instance OVR is not in a team list file.

## Notes

- **2026-10-30:** Facts from the code and the specs. `rollOVR(tier, rng)` already rolls inside a Tier range, and returns a whole number. `TIER_OVR_RANGES` has 10-point ranges, from F = 30 to 39 up to S = 90 to 99. A test in `tierOvr.test.ts` checks that the module exports only `TIER_ORDER`, `TIER_OVR_RANGES`, `isTier`, and `rollOVR`. The Task 81 report asks for new words in the `rollOVR` doc comment. Only `app/state/leagueWrapperActions.ts` calls `rollOVR`, at league create (Task 160).

## Choices for discussion

| # | Choice | Effect | Undo cost |
|---|---|---|---|
| 1 | The check gives `true` or `false`, not a problem code. | The screen writes its message from `TIER_OVR_RANGES`, for example "60 to 69". | Low |
| ⚠ 2 | A decimal OVR is not valid. | The Edit field accepts whole numbers only, as the roll gives. | Low |
| ⚠ 3 | A change to the same Tier keeps the OVR. Only a different Tier rolls again. | A user override stays when the Tier select gets the same value again. | Low |
| 4 | Names: `isOvrInTier(ovr, tier)` and `ovrAfterTierChange(current, newTier, rng)`. `current` is `{ tier, ovr }`. | The engine stays generic: no `TeamInstance` import. | Low |

## Report

- **What was built:** two functions in `engine/tier-ovr/tierOvr.ts`, exported from `engine/tier-ovr`. `isOvrInTier(ovr, tier)` accepts a whole number inside the Tier range. `ovrAfterTierChange(current, newTier, rng)` rolls a new OVR for a different Tier, and keeps the OVR for the same Tier. The `rollOVR` doc comment names both.
- **Test approach:** unit tests, 8 new: both range ends and one step outside each end for all 7 Tiers, the Tier C example, a decimal, `NaN`, and `Infinity`. For the Tier change: a range check over 200 seeds, the same value as `rollOVR`, the same Tier with a spy that shows no `rng` call, and the same seed. The export test lists the two new names. Full suite: 817 tests pass. Lint, format check, type check, and `npm run build` pass.
- **Decisions made:** the four choices above, agreed by the user. Claude choice: `current` is an inline `{ tier, ovr }` type, not a new exported type.
- **What is left, what is next:** no screen uses the rules yet. Task 121 adds the OVR field to the Edit drawer, with the range text, and calls both functions. Tasks 117 and 118 can start next.
