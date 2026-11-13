# Task 213: the Season view and its Teams tab

**Status:** Refactor

## Goal

Add the Season view of the M1 demo (Task 206, Task 249): the header, the finish and reopen of a Season, and the Teams tab with the roster, the add dialog, and the edit drawer. "Open Season" on the Seasons list then lands here (Task 205, M1).

## Acceptance criteria

- [x] `/seasons/:uuid` opens the Season from its file, and shows it. An unknown UUID shows "Season not found." A file error shows its message (US-13.3).
- [x] The header shows the name, the year, an Unsaved badge, the counts, the Running or Finished badge, and "← Seasons".
- [x] "Finish Season" asks for a confirm, then makes the Season read only. "Reopen Season" opens it again. A finished Season shows a notice, and its add and edit buttons are disabled (US-13.9, demo points 5 and 6).
- [x] The Teams tab lists the roster in join order: colour, team and Location, trigram, the Tier and OVR box, and the leagues of each team (US-13.4, demo point 7, Task 249).
- [x] "+ Add teams" opens the "Add teams" dialog with the Blueprints that are not in the Season. A join rolls the OVR, and picks the names and trigrams (US-13.4, Task 211).
- [x] ✎ opens the edit drawer of a Season team: name, slug, colour, Tier, OVR, and trigram. A Tier change rolls a new OVR. A problem shows next to its field (US-13.4, demo point 10).
- [x] Screen tests with Testing Library, written first (`docs/tdd.md`). The full suite, the type check, the lint, and the format check pass.
- [x] The user checks the screen in the real app.

## Notes

- **2026-11-13:** Started. Inputs: the M1 demo `m1-season-view.html` and its agreed points, Task 249 (the Tier and OVR box), Tasks 210 and 211 (the Season actions), `useLeagueDetail` (the open states), the wizard Teams step (`PickerDialog`, `toPickerItem`, `EditTeamDrawer`), `features/components` (`TeamNameField`, `TeamColourField`, `TeamTierField`, `FieldError`, `TeamSwatch`). `TeamLabel` lives in `features/leagues`, so a Season screen cannot import it (`FEATURES.md`). Eight choices sent to the user.
- **2026-11-13:** The user agreed the eight choices. (1) `SeasonViewScreen/` with `TeamsTab/` and `SeasonTeamDrawer/`. (2) Only the Teams tab now. (3) The Leagues section with its heading and "No leagues yet.". (4) The open states of League Detail. (5) A hint for a picked team that clashes with a roster team. (6) A new `SeasonTeamDrawer`, trigram required. (7) `TeamLabel` moves to `features/components/`. (8) The status line texts.
- **2026-11-13:** Tests first: 16 screen cases failed (no module), then passed. Two fixes on the way: the shared name field has the label "Team name", so the tests use it. The `seasonWrapper` fixture gave both roster teams the trigram "SMU". A Season roster has one trigram for each team, so the fixture now gives "SMU" and "HAR".
- **2026-11-13:** Claude choices in the code, for the review. (a) `formatCount`, `formatSeasonMeta`, and `formatSeasonLabel` moved to `features/seasons/seasonText.ts`, because both Season screens use them. (b) The roster count line reads "2 teams in the roster. A team cannot leave the Season.", as in the demo. (c) The drawer note for a team in no league reads "The team is in no league of this Season yet." (d) "+ Add teams" sits on the tab row, as the actions of League Detail do.
- **2026-11-13:** A gap outside the diff, for the user: the Season file parser of Task 209 does not check that each roster trigram is unique. A file with two equal trigrams opens, and the next join throws. A small task can add the check.
- **2026-11-13:** The user agreed the review and the Claude choices. The trigram check becomes Task 251. Commit 1. Status Refactor.

## Report

- **What was built:** `features/seasons/SeasonViewScreen/` with `TeamsTab/` and `SeasonTeamDrawer/`, and the route `/seasons/:uuid`. `TeamLabel` moved to `features/components/`. The shared Season texts moved to `features/seasons/seasonText.ts`.
- **Test approach:** Testing Library through the screen, 16 cases: the open states, the header, the empty Leagues section, the one tab, the roster with the Tier and OVR box, a resting team, the add dialog, its hint, the edit drawer, a Tier change roll, the field problems, finish, and reopen. The full suite passes: 2216 tests. The type check, the lint, the format check, and the build pass.
- **Decisions made:** the eight choices (Decisions log). The Claude choices (a) to (d) are in the notes.
- **What is left:** the user checks the screen in the real app. A gap outside the diff is in the notes: the unique roster trigram check of the Season file.
- **Refactor:** waits for the review.
