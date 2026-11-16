# Task 227: the SegmentedControl end labels and icon options

**Status:** Done

## Goal

`SegmentedControl` in `design-system/` can show the condition control of US-14.1, as the Task 223 demo shows it: "Crisis" and "Peak" at the two ends, and five square options with the level icons. Tasks 229 to 231 use it. The current callers do not change.

## Acceptance criteria

- [x] The control takes number values, so a caller can use the condition levels (-2 to 2) as they are.
- [x] An option can have an accessible name of its own, for an option that shows an icon. A screen reader reads it, and the mouse tooltip shows it.
- [x] Optional text at the start and the end of the row: "Crisis" and "Peak" in the condition control. A control with no end text looks as today.
- [x] An optional icon look: square options with the icon character, as in the Task 223 demo (`m3-league-detail.html`). The selected option keeps the accent fill.
- [x] The keyboard, the click, `onChange`, the ref, and `disabled` work as today with the new props.
- [x] The current four callers show no change.
- [x] Testing Library tests through the rendered control. No test of internal markup.
- [x] Lint, the format check, the type check, and the full suite pass.

## Notes

- **2026-11-16:** Started. Inputs: US-14.1 (the icons, the end labels, the icons as Unicode characters), the agreed Task 223 demo (`docs/design-reference/MVP3/m3-league-detail.html`, `.cond` classes in `demo.css`), `src/design-system/DESIGN_SYSTEM.md`, and the current primitive. Its callers: `ResolveConflictsDialog`, `PhaseCard`, `BracketSettings`, and `PlayoffDialog`.
- **2026-11-16:** The control takes `T extends string` today. The levels are numbers (Task 224).
- **2026-11-16:** The user agreed the criteria and six choices: (1) `T extends string | number`. (2) An optional `ariaLabel` on an option, for its name and tooltip. (3) Optional `startLabel` and `endLabel`, hidden from a screen reader. (4) A boolean `iconOptions` for the square icon look. (5) The level list goes in `features/components/` with Task 229 or 230, not in `design-system/`. (6) The current disabled style stays.
- **2026-11-16:** Tests first: 4 of the 7 new tests failed before the code. The other 3 already passed: the default with no tooltip, no end labels without the props, and `disabled`. A temporary Vite page with headless Chromium showed the icon control with and without end labels, disabled, and a text control. It matched the Task 223 demo, and the text control looked as before. The page was deleted after the check.
- **2026-11-16:** The user agreed the review. Commit 1, then the refactor pass.
- **2026-11-16:** Refactor pass done: one class rename. The refactor review waits for the user.
- **2026-11-16:** The user agreed the refactor review: Done.

## Report

- **What was built:** `SegmentedControl` takes number values (`T extends string | number`). `SegmentedOption.ariaLabel` names an icon option and gives it a tooltip. `startLabel` and `endLabel` put grey mono text at the two ends of the row, with `aria-hidden`. `iconOptions` makes square 2rem options with the icon in mono at `--font-size-xl`, with no uppercase. The group now sits in a flex row, also with no end labels: a text control looks the same.
- **Test approach:** 7 new Testing Library tests in `SegmentedControl.test.tsx`: the option names and icons, the tooltip, no tooltip without `ariaLabel`, the end labels and their `aria-hidden`, no end labels without the props, a click, a key, the ref, and `setValue` with number values, and `disabled`. The 21 tests that were there still pass, so the four current callers keep their behavior. The look was checked by a screenshot, not by a test (`docs/tdd.md`: no test of a component's internal markup). Full suite: 2418 tests pass. Lint, the format check, and the type check pass.
- **Decisions made:** the six choices above. They are in the `PROGRESS.md` Decisions log.
- **What is left, what is next:** the level list (the five values, icons, and names) waits for Task 229 or 230. Task 229 (the condition in the wizards) can start now.
- **Refactor:** one CSS class rename, no change in look or behavior. `.endLabel` styled the start text too, and it had the name of the `endLabel` prop. It is now `.sideLabel`, in `SegmentedControl.module.css` and its two uses in `SegmentedControl.tsx`. A search finds no old class name. Lint, the format check, the type check, and the full suite (2418 tests) pass.
