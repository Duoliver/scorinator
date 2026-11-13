# Task 212: the Seasons menu and list

**Status:** Refactor

## Goal

Add the Seasons screen of the M1 demo (Task 206): a Seasons menu item, a list of Season cards, a search, and the create, rename, and delete of a Season. The screen uses the Season store of Tasks 210 and 211 (Task 205, M1).

## Acceptance criteria

- [x] The sidebar has a "Seasons" item between "Leagues" and "Teams". It stays marked on the Seasons list and on a Season view (demo point 1).
- [x] The list shows one card for each Season: the name, the year, a Running or Finished badge, an Unsaved badge, the counts, "Open Season", and a ⋮ menu with "Rename..." and "Delete..." (demo points 2 and 4).
- [x] "+ New Season" opens a dialog with a name and a year. A name and year pair that a Season has shows an error, and creates nothing (US-13.1).
- [x] "Rename..." opens the same dialog with the current name and year. A finished Season can be renamed too (US-13.2, Task 210).
- [x] "Delete..." asks for a confirm that names what goes, and that the Blueprints stay (US-13.2).
- [x] The search matches the name and the year, in any case. An empty field shows all Seasons. A search with no match says so (US-16.5).
- [x] With no Season, the screen shows an empty state with "+ New Season".
- [x] Screen tests with Testing Library, written first (`docs/tdd.md`). The full suite, the type check, the lint, and the format check pass.
- [x] The user checks the screen in the real app.

## Notes

- **2026-11-13:** Started. Inputs: the M1 demo `docs/design-reference/MVP3/m1-seasons-list.html` and its agreed points, Task 210 (`createSeason`, `renameSeason`, `deleteSeason`, `currentSeasonRows`, `isSeasonNameTaken`, `isSeasonUnsaved`), the leagues dashboard (`LeagueList`, `useLeaguesDashboard`), the primitives `Card`, `Badge`, `Button`, `Modal`, `Input`, `ConfirmDialog`, `DropdownMenu`, the status line. Seven choices sent to the user.
- **2026-11-13:** The user agreed the seven choices. (1) `features/seasons/SeasonsListScreen/` with `SeasonList/` and `SeasonDialog/`. (2) The routes `/seasons` and `/seasons/:uuid`. (3) The counts in the card text and the subtitle. (4) The dialog button stays disabled for a blank field. A taken pair shows the error after the click. (5) The status line texts of the demo. (6) The search also matches "name year" together. (7) The manifest order.
- **2026-11-13:** Tests first: 14 screen cases and 2 nav cases failed, then passed. One test helper matched the meta line too. It now reads the card label.
- **2026-11-13:** Claude choices in the code, for the review. (a) Each card is an `article` with the label "Liga Norte 2026", so a screen reader names it. (b) The ⋮ menu is the `DropdownMenu` primitive, with the label "More actions for Liga Norte 2026". (c) The dialog is a form, so Enter submits it. (d) A rename that cannot open the Season file closes the dialog, and shows the file error in the status line. (e) The delete confirm leaves out a part with a count of 0. With no part, it says "This deletes the Season." (f) The nav check for Leagues and Seasons now shares one list of parent paths.
- **2026-11-13:** The user checked the screen in the real app, and agreed the review and the Claude choices. Commit 1. Status Refactor.

## Report

- **What was built:** `features/seasons/SeasonsListScreen/` with `SeasonList/` and `SeasonDialog/`. The routes `/seasons` and `/seasons/:uuid`, with `seasonDetailPath`. The "Seasons" nav item between "Leagues" and "Teams".
- **Test approach:** Testing Library through the screen, 14 cases: the empty state, the cards, the counts, create, a taken pair, Cancel, rename, delete, its Cancel, and the search. 2 nav cases in `AppShell/helpers.test.ts`. The full suite passes: 2198 tests. The type check, the lint, the format check, and the build pass.
- **Decisions made:** the seven choices (Decisions log). The Claude choices (a) to (f) are in the notes.
- **What is left:** the user checks the screen in the real app. "Open Season" lands on the leagues dashboard until Task 213 adds the Season view.
- **Refactor:** waits for the review.
