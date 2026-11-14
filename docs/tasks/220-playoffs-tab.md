# Task 220: the Playoffs tab and the playoff dialog

**Status:** Refactor

## Goal

Give the Season view its "Playoffs" tab and the "New playoff" dialog (US-13.7), as the Task 215 demo shows them after five review rounds (`m2-season-view.html`). Task 217 gives the store actions.

## Acceptance criteria

- [x] The Season view has a "Playoffs" tab after "Teams". "+ New playoff" sits on the tab row while the tab is open.
- [x] One row for each playoff, in the fixtures row style: a black head with the name in bold upper case and the rules in plain text at the end side, then Team 1, the total, Team 2, and the status (Task 215 points 2 and 3).
- [x] A tie with more than one match shows each match score and the decision in a row below, in the format of the bracket .txt export. The losing team is grey.
- [x] A played playoff shows "✓ Played". An open one shows "Play".
- [x] On a narrow screen, the row stacks as the fixtures row, and the head shows only ✓ with the name "Played".
- [x] The dialog: a name, "Team 1" and "Team 2" from the single team picker, "Tie format", "Away goals rule" (two-legged only), "Plays AET", "Tiebreak method", and "Home advantage" (Task 215 point 4).
- [x] The team picker lists the Season roster. The team of the other slot shows disabled, with its slot (Task 215 point 4c).
- [x] A finished Season has "+ New playoff" and "Play" disabled (US-13.9).
- [x] Screen tests written first (`docs/tdd.md`). The full suite, the type check, the lint, and the format check pass.

## Notes

- **2026-11-14:** Started. Inputs: US-13.7, the Task 215 demo and its rounds 1 to 6, Task 217 (`createPlayoff`, `playPlayoff`, `isPlayoffNameTaken`), the wizard `BracketSettings` (labels, `DEFAULT_BRACKET_RULES`), `PickerDialog` (no disabled item yet), the bracket .txt export (`adapters/txt/resultsTxt.ts`, the score line rules). Choices sent to the user.
- **2026-11-14:** The user agreed the nine choices: (1) the tab row action follows the open tab. (2) `PlayoffsTab` and `PlayoffDialog` folders. (3) A pure score line helper with the .txt export rules. (4) The bracket defaults, and "Home advantage" off. (5) The name check and the disabled create. (6) `disabled` and `status` on `PickerItem`. (7) The status line after "Play". (8) "No playoffs yet.", creation order. (9) A "* after extra time" line when a match went to AET.
- **2026-11-14:** Tests first: the picker disabled item (1), the score line and the rules text (6), and the Playoffs tab and dialog (8) failed, then passed.
- **2026-11-14:** Claude choices in the code, for the review:
  - (a) The labels of the tie rules are in `SeasonViewScreen/tieLabels.ts`, shared by the rows and the dialog. The wizard `BracketSettings` keeps its own option lists.
  - (b) "Create playoff" closes the dialog, and the status line says "Created Supertaça.".
  - (c) The team picker says "Only the teams of the Season roster." under its title.
  - (d) The Task 213 test "shows only the Teams tab" now expects the Teams and Playoffs tabs.
  - (e) The open tab is kept in the view state, so the tab row action stays right after a play or a create.
- **2026-11-14:** Review, round 1. The user asked for the Location hint on each team name, and the full name in the hint of a cut name, as on the other league screens. Each row now shows its teams with the shared `TeamName` (Task 180), and cuts the name text with an ellipsis. One more test: the Location shows in the hint.
- **2026-11-14:** The user agreed the review and the Claude choices (a) to (e). Commit 1. Status Refactor.

## Report

- **What was built:**
  - `design-system/PickerDialog`: `disabled` and `status` on an item.
  - `features/seasons/SeasonViewScreen/PlayoffsTab`: the rows, the score line and rules helpers, the narrow layout.
  - `features/seasons/SeasonViewScreen/PlayoffDialog`: the dialog, with the two team fields and the single team picker.
  - `features/seasons/SeasonViewScreen`: `usePlayoffs`, `tieLabels.ts`, the "Playoffs" tab, and the tab row action of the open tab.
- **Test approach:** unit tests for the score line and the rules text (6 cases), one picker test, and screen tests with Testing Library (9 cases): the rows and their status, the Location hint, a play, the tab row action, the empty tab, a create through the team picker, the away goals switch, a taken name, and a finished Season. The full suite passes: 2320 tests. The type check, the lint, and the format check pass. The narrow layout has no test: jsdom has no container queries. It follows the agreed demo.
- **Decisions made:** the nine choices (Decisions log). The Claude choices (a) to (e) are in the notes.
- **What is left, what is next:** Task 221, the Resume tab. A live check: create a two-legged playoff with AET, play it, then make the window narrow.
- **Refactor:** waits for the review.
