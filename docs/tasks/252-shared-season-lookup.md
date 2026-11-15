# Task 252: one shared lookup of an open Season

**Status:** Done

## Goal

Three Season action files look up an open Season, and check that it runs, each in its own way: `seasonActions.ts` (`requireOpenSeason`), `seasonLeagueActions.ts` (inline), and `seasonPlayoffActions.ts` (`requireRunningOpenSeason`). One shared helper removes the three copies. A plain refactor: no change in behavior.

## Acceptance criteria

- [x] `databaseStore.ts` gets two guards next to `requireOpenDatabase` and `requireRunningSeason`: `requireOpenSeason(state, uuid)` gives an open Season, and `requireRunningOpenSeason(state, uuid)` gives an open Season that is not finished.
- [x] The three action files use the two guards. Their private copies go.
- [x] Each error message stays the same: "No open Season has the UUID …", and the finished message of `requireRunningSeason`.
- [x] A unit test for each guard. The earlier tests pass with no change.
- [x] After the move, a search for the old private names finds nothing in `src/`.
- [x] The full suite, the type check, the lint, and the format check pass.

## Notes

- **2026-11-14:** Task created by the user, from the Task 217 refactor pass. A gap outside the Task 217 diff: the refactor pass did not fix it.
- **2026-11-14:** The user agreed the criteria. Started.
- **2026-11-14:** Tests first: 5 guard cases failed, then passed. Claude choices, for the review: (a) the guards take the store state as their first parameter, as `isSeasonNameTaken` does, so a test needs no store. (b) `reopenSeason` and `renameSeason` keep `requireOpenSeason` only: a finished Season can be reopened and renamed (Task 210). (c) The playoff actions call `requireOpenDatabase` for the installation, as the league actions do.
- **2026-11-14:** The user agreed the review and the Claude choices (a) to (c). Commit 1. Status Refactor.
- **2026-11-14:** Refactor pass, against the review checklist: no change. The comments say why, the names start with a verb, and no private copy stays in `src/`. No gap outside the diff, no bug. Waits for the refactor review.
- **2026-11-14:** The user agreed the refactor review. Done.

## Report

- **What was built:** `requireOpenSeason` and `requireRunningOpenSeason` in `app/state/databaseStore.ts`. `seasonActions.ts`, `seasonLeagueActions.ts`, and `seasonPlayoffActions.ts` use them, and their three private copies are gone. No change in behavior.
- **Test approach:** unit tests for the two guards (`databaseStore.test.ts`, 5 cases), on plain state objects. The Season, Season league, and playoff tests pass with no change. The full suite passes: 2268 tests. The type check, the lint, and the format check pass.
- **Decisions made:** the criteria. The Claude choices (a) to (c) are in the notes.
- **What is left, what is next:** nothing. Tasks 218 to 220 can start.
- **Refactor:** no change. The checks pass: 2268 tests.
