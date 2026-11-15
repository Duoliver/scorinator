# Task 253: the Location hint on the fixtures team names

**Status:** Refactor

## Goal

The fixtures row shows each team name as plain text. The standings, the bracket, and the playoff rows use `TeamName`: the Location shows in a hint, and a cut name shows the name too (US-09.3, Task 180). Give the fixtures row the same hint. Found in the Task 220 refactor pass.

## Acceptance criteria

The user agreed the criteria on 2026-11-15.

- [x] Each team name of a fixtures row uses `TeamName`, with the Location of its Blueprint.
- [x] A hover on a name shows the Location. A name that the row cuts shows the name and the Location.
- [x] The narrow, stacked row keeps its layout: one line for each team, with the goals at the end.
- [x] A screen test for the hint. The full suite, the type check, the lint, and the format check pass.

## Notes

- **2026-11-14:** Task created by the user, from the Task 220 refactor pass. It starts after Task 221.
- **2026-11-15:** The user agreed the criteria. Started.
- **2026-11-15:** Tests first: the hint on hover and focus, and the cut text mark, failed. Then they passed. The test of no hint for no Location passed before the code too: the plain name had no Tab stop either.
- **2026-11-15:** Claude choices in the code, for the review:
  - (a) A long name cuts on one line, with an ellipsis. Before, it went on a second line. The team columns are now `minmax(0, 1fr)`, as in the playoff row.
  - (b) The bye row keeps its plain name. The criteria name the match rows only.
  - (c) `TeamName` gets no trigram: the row keeps its own trigram beside the swatch (Task 157 choice 3).
- **2026-11-15:** The user agreed the review, with the Claude choices (a) to (c). Commit 1. The refactor pass is next.

## Report

- **What was built:** each team name of a fixtures match row uses `TeamName`, with the Location of its Blueprint. The name text cuts with an ellipsis, so a cut name gives the name and the Location in its hint (Task 180).
- **Test approach:** three screen tests: the hint on hover, with a Tab stop; no hint and no Tab stop with no Location; the cut text mark on each name. jsdom has no layout, so the cut itself stays a `TeamName` test, and the stacked layout is a CSS check in the app. The full suite passes: 2332 tests. The type check, the lint, and the format check pass.
- **Decisions made:** the Claude choices (a) to (c) are in the notes.
- **What is left, what is next:** a live check: a long name and a Location, in the wide and the narrow row. Then Task 222, the M2 smoke check.
- **Refactor:** waits for the review.
