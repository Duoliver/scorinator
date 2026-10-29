# Task 114: the 24-colour palette, and 3 rows in the swatch picker

**Status:** Done

## Goal

Give teams the 24 colours of US-09.7 (Task 101), so each team in a league looks different, and the two blues are easy to tell apart.

## Acceptance criteria

The criteria of US-09.7, which the user agreed in Task 101 (2026-10-28). The task has no open choice.

- [x] `TEAM_PALETTE` has the 24 entries of US-09.7, in its order, with its names and hex values.
- [x] The swatch picker shows the palette in 3 rows of 8.
- [x] White stays the colour of a new team.
- [x] A team keeps its hex value. A team with an old value keeps its colour, and the picker shows no selected swatch.
- [x] The palette tests check 24 entries, the hex format, and unique names and values. They check rules, not values.
- [x] `npm run lint`, `npm run format:check`, `npm run type-check`, and `npm test` pass.

**Out of scope:** the colour distance test (`scorinator-future-features.md` §13). A custom colour (MVP3). A map from the old values to the new ones.

## Notes

- **2026-10-29:** Facts from the code. The swatch grid already has 8 columns, so 24 entries give 3 rows with no CSS change. `TeamForm.test.tsx` already checks one swatch for each palette entry, White for a new team, and no selected swatch for a colour outside the palette.
- **2026-10-29 (review):** The user asked for a hint with the colour name on each swatch. `SwatchPicker` wraps each swatch in a `Tooltip` (Task 111). The hint shows on hover and on keyboard focus. The radio already has the name as its accessible name, so the hint gets no `aria-describedby`, and a screen reader does not say the name twice. Three new tests.
- **2026-10-29 (review):** The user found that a swatch hint covers the swatch above it, and keeps it from a click. `Tooltip` (Task 111) has a new option, `notHoverable`: the pointer goes through the hint, and the hint hides at once when the pointer leaves the trigger. The swatches use it. Two new tests. The user first saw the option as `hoverable`, on by default. The user asked for `notHoverable`, off by default, because every other boolean prop of `design-system/` is off by default. The user then asked for the rule in `docs/coding-standards.md`: "A boolean prop is off by default". A hint that follows the pointer is new Task 166.

## Report

- **What was built:** `TEAM_PALETTE` has the 24 colours of US-09.7, in its order. The swatch picker shows them in 3 rows of 8, with no CSS change. `DESIGN_SYSTEM.md` says 24.
- **Test approach:** unit tests on the palette rules: 24 entries, and a new test for whole rows of 8. The `TeamForm` test that saved Gold now reads the Gold value from the palette, so it checks a rule, not a value. The existing `TeamForm` tests cover White for a new team and no selected swatch for an old colour. Full suite: 784 tests pass, with the 5 hint tests. Lint, format check, type check, and `npm run build` pass. The user checked the 3 rows and the hints in the real app.
- **Decisions made:** US-09.7 settled every colour. At review, the user asked for the colour name hint, the `notHoverable` option, and the boolean prop rule.
- **What is left, what is next:** a team made before this task with Orange, Gold, Sky Blue, or Blue keeps its old hex, and the picker shows no selected swatch for it (US-09.7).

