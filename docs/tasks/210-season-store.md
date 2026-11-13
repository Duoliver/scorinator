# Task 210: the Season store

**Status:** Refactor

## Goal

Give `app/state` the Season actions: create, rename, delete, open, finish, and reopen a Season, with the unique name and year and the read-only guard. A save writes each changed Season wrapper, and removes the file of a deleted Season. Tasks 211 to 213 build on it (Task 205, M1).

## Acceptance criteria

- [x] The user creates a Season with a name and a year. Both are required. The pair is unique in the database, in any case (US-13.1).
- [x] A new Season has no leagues, no teams, and no playoffs. It has a UUID and the provenance fields (US-13.1, US-11.1).
- [x] The user renames a Season: the name, the year, or both. The pair stays unique (US-13.2).
- [x] The user deletes a Season. Its leagues, roster, and playoffs go with it. The Blueprints stay (US-13.2).
- [x] The user finishes and reopens a Season. A finished Season is read only: an action that changes it throws (US-13.9).
- [x] A Season opens from its file, as a league does. A change makes it unsaved. A save writes it, and the close guard sees it.
- [x] A save after a delete removes the Season file and its manifest row (`PERSISTENCE.md` §3: the manifest last).
- [x] The database export holds the unsaved changes of an open Season.
- [x] Store tests written first (`docs/tdd.md`). The full suite, the type check, the lint, and the format check pass.

## Notes

- **2026-11-13:** Started. Inputs: Task 209 (the Season files, `seasonRows` in the store), `app/state/databaseStore.ts` (`currentRows`, `isLeagueUnsaved`, `isManifestUnsaved`), `app/state/leagueWrapperActions.ts` (`createLeague`, the provenance stamp), `persistence/types.ts` (`DatabaseFolder.save` writes, and never removes a file). Eight choices sent to the user.
- **2026-11-13:** The user agreed seven choices, and changed choice 5: a finished Season and its leagues can be renamed. A finished Season can be deleted. US-13.9 and US-16.2 have the change, dated. The agreed choices: (1) `seasons` and `savedSeasons` in the database store, actions in `seasonActions.ts`. (2) A Season row comes from its open Season. (3) Six actions. (4) `isSeasonNameTaken`, and a throw for a blank or taken pair. (6) `DatabaseFolder.save` removes the files of deleted Seasons after the manifest write. (7) The provenance stamp. (8) The save, the export, and the close guard see an open Season.
- **2026-11-13:** Tests first. The folder remove tests and the 24 Season action cases failed, then passed. The `persistence/types.test.ts` contract test got the new `removed` parameter.
- **2026-11-13:** Claude choices in the code, for the review. (a) `removed` is an optional third parameter of `save`, so the earlier callers stay as they are. (b) A save removes files only when it writes the manifest. (c) A Season created and deleted before a save leaves nothing to save. (d) `reopenSeason` on a running Season changes nothing but the stamp. (e) A rename opens the Season from its file, so the screens can call it from the Seasons list.
- **2026-11-13:** The user agreed the review and the Claude choices. Commit 1. Status Refactor.

## Report

- **What was built:**
  - `app/state/seasonActions.ts`: `createSeason`, `openSeason`, `renameSeason`, `deleteSeason`, `finishSeason`, `reopenSeason`.
  - `app/state/databaseStore.ts`: `seasons`, `savedSeasons`, `currentSeasonRows`, `findDeletedSeasonUuids`, `isSeasonNameTaken`, `isSeasonUnsaved`, `unsavedSeasons`, and the guard `requireRunningSeason`. The unsaved checks count the Seasons.
  - `app/state/summarizeSeason.ts`: the Season row from a Season.
  - `saveDatabase` writes the unsaved Seasons and removes the files of deleted Seasons. The database export takes an open Season from memory.
  - `persistence/` and `adapters/tauri-fs`: `save` takes the UUIDs of deleted wrappers, and removes their files after the manifest write.
- **Test approach:** store tests on the in-memory folder (`seasonActions.test.ts`, 24 cases): create, the unique pair, open, rename, finish, reopen, delete, the save, the remove, and the export. Integration tests on a real temp folder for the remove (3 cases). The full suite passes: 2163 tests. The type check, the lint, and the format check pass.
- **Decisions made:** the eight choices, with the rename of a finished Season (Decisions log). The Claude choices (a) to (e) are in the notes.
- **What is left:** Task 211 adds the roster actions, and calls `requireRunningSeason`. Task 244 (the league delete) uses the same file remove.
- **Refactor:** waits for the review.
