# Task 209: the Season files

**Status:** Refactor

## Goal

Read and write a Season: its wrapper file, its manifest row, and its place in the database zip. Add `Manifest.seasons`, as Task 207 left it for this task. Task 210 then builds the Season store on these files (Task 205, M1).

## Acceptance criteria

- [x] A Season wrapper file round-trips: the write, then the read, gives the same Season wrapper (US-13.1, US-13.11).
- [x] The read checks the Season wrapper, and fails with a clear message for a file that is not valid.
- [x] `Manifest.seasons` exists in `domain/`, in the manifest file, and in `app/data`. The compiler finds each place that builds a manifest, and each place carries the Seasons.
- [x] An older manifest, of format version 2 to 4, reads with no Seasons.
- [x] The database zip holds the Season wrappers next to the league wrappers (US-13.11, database part).
- [x] No Season row or Season wrapper is lost on a save or an export.
- [x] Integration tests for `adapters/json-io` and `app/data`, written first (`docs/tdd.md`).
- [x] The full suite, the type check, the lint, and the format check pass.

## Notes

- **2026-11-13:** Started. Inputs: Task 207 (the Season types, `Manifest.seasons` moved here), `adapters/json-io/database.ts` (format version 4, `parseManifest`, `parseWrapper`, `readLeague`, `readTieResult`), `adapters/json-io/databaseZip.ts`, `app/data/databaseFile.ts`, `app/state/databaseActions.ts`. The folder adapter reads and writes `wrapper-{uuid}.json` for any UUID, so a Season wrapper needs no folder change. Seven choices sent to the user.
- **2026-11-13:** The user agreed six choices, and changed choice 3: the year is free text, not a number. Examples: "2026", "1", "2026-27", "4E 201". This changes `Season.year` and `SeasonSummary.year` of Task 207 to `string`. US-13.1 and point 3 of the demo index have a note. The agreed choices: (1) format version 5, reads 2 to 5. (2) A Season file has the kind `season`. (4) The playoff checks. (5) The manifest checks. (6) The store keeps the Season rows. (7) The zip carries the Season wrappers, and the database import skips them until Task 247.
- **2026-11-13:** Tests first. The new cases failed (no `parseSeasonFile`, no `Manifest.seasons`), then passed. Four older tests named format version 4 or used "season" as an unknown kind: updated.
- **2026-11-13:** Claude choices in the code, for the review. (a) The year must not be blank. It has no length limit. (b) A Season league reuses the league reader. Its errors read "A Season file is not valid: league 2: ...". (c) The name match of Task 208 (`getNameKey`) is now exported from `engine/identity`, for the file checks of the playoff names and the Season name and year. (d) `readInstance` and `readScore` take an optional error prefix, so a Season file error never says "A league file". (e) A Season file picked in "Import leagues" or "Import teams" gets the database file message, as a league wrapper file does.
- **2026-11-13:** The user agreed the review and the Claude choices. The year needs no length limit. Commit 1. Status Refactor.

## Report

- **What was built:**
  - `adapters/json-io/season.ts`: `parseSeasonFile` and `serializeSeasonFile`, with the Season, league, and playoff checks.
  - `adapters/json-io`: format version 5, the Season file types, the Season rows of the manifest, and the Season wrappers in the database zip.
  - `app/data`: `parseSeasonWrapper`, `serializeSeasonWrapper`, the Season rows in the manifest map, and the Seasons in `packDatabase` and `readDatabaseZip`.
  - `app/state`: the store keeps `seasonRows`. A save writes them, and the export packs each Season wrapper from the folder.
  - `domain/`: `Manifest.seasons`, and a free-text year.
- **Test approach:** integration tests on the real parsers and the in-memory folder. A round trip of a Season file and of a manifest with Season rows. 17 failure cases of the Season file, and 7 of the Season rows. The zip with a Season, and with no file for a Season row. The save keeps the Season rows. The export holds a Season wrapper. The import skips it. The full suite passes: 2135 tests. The type check, the lint, and the format check pass.
- **Decisions made:** the seven choices, with the free-text year (Decisions log). The Claude choices (a) to (e) are in the notes.
- **What is left:** Task 210 opens, changes, and saves a Season wrapper in the store. Task 247 imports the Seasons of a database zip.
- **Refactor:** waits for the review.
