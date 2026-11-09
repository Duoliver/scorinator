# Task 150: League Detail export menu

**Status:** Done

## Goal

The League Detail header gets one export menu with three items: the league `.json`, the results `.txt`, and the slug list `.txt` (US-10.1, US-10.5, US-10.6). The file functions exist from Tasks 145 and 148. This task adds the menu and the actions. It also gives back the results export, which left the File screen in Task 149.

## Acceptance criteria

The user agreed the criteria on 2026-11-09.

- [x] The League Detail header has an export menu with three items, in this order: "Export league (.json)", "Export results (.txt)", "Export slug list (.txt)".
- [x] "Export league" opens a save dialog with the default name from the league slug, for example `coastal-premier.json`.
- [x] The file holds the one league, its Instances, and a snapshot of each Blueprint that still exists (Task 145).
- [x] "Export results" writes the Task 148 text, with the default name `<league slug>-results.txt`.
- [x] "Export slug list" writes the Task 148 list in the final ranking, with the default name `<league slug>-ranking.txt`.
- [x] Each export uses the live league, with its unsaved changes, and changes no unsaved marker.
- [x] Each export reports the path, "Export canceled.", or the error on the status line.
- [x] The menu shows only for a league that is open.
- [x] Integration tests through the screen, with the file dialogs faked: each item, a cancel, and an error.
- [x] The manual check in the real app covers the three files.

**Out of scope:** an import on League Detail. A change to the file formats.

## Notes

- **2026-11-09:** Facts from the code.
  - `DropdownMenu` has a `label ▾` trigger and `align: 'end'` (Task 127). No new primitive is necessary.
  - `exportResultsTxt` and `exportSlugListTxt` exist in `app/data`. `exportResults` in `app/exportActions.ts` has no caller since Task 149.
  - `saveLeaguesFile` gives the name `scorinator-leagues-<date>.json`, so the one-league export needs its own save function.
  - The handoff League Detail has no export button. The menu is a Claude choice that the user confirmed on 2026-10-28 (US-10.1).
- **2026-11-09:** Proposed choices, for the user to agree before the work starts:

  | # | Choice | Proposal | Flag |
  |---|---|---|---|
  | 1 | The menu | A `DropdownMenu` with the label "Export", at the right of the header, after the progress badge. It lines up with the right edge of its button. | |
  | 2 | The message | All three exports say "Saved to <path>", as the File screen exports do. | ⚠ The results export says "Exported <league> results to <path>" today (MVP1). |
  | 3 | The actions | `exportLeague`, `exportResults`, and `exportSlugList` in `app/exportActions.ts`. Each takes the open league. The `exportResults` check for an unknown league and its open call go, because League Detail always has the league open. | |
  | 4 | The one-league save | A new `saveLeagueFile` in `app/data/exportFile.ts`, with the default name `<league slug>.json` and no date (US-10.1). | |
- **2026-11-09:** The user agreed the criteria and the 4 choices.
- **2026-11-09:** The user agreed that the task is Done.

## Report

- **What was built:** the "Export" menu in the League Detail header. `saveLeagueFile` in `app/data/exportFile.ts`. `exportLeague`, `exportResults`, and `exportSlugList` in `app/exportActions.ts`, each with the open league.
- **Test approach:** integration tests through the screen, on the real stores, with the file dialogs faked: the three items and their order, the live league with unsaved changes, a cancel, an error, and no menu for a league that is not found. Unit tests for the save function and the actions. The round trip of a league file is in Task 145.
- **Manual check:** the user checked the three files and the place of the menu in the real app on 2026-11-09.
- **Decisions made:** choices 1 to 4 in the `PROGRESS.md` Decisions log on 2026-11-09.
- **What is left, what is next:** Task 151, the M5 smoke check.
