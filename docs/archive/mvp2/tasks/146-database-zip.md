# Task 146: The database `.zip` export and import

**Status:** Done

## Goal

"Export entire database" puts the manifest and every league wrapper in one `.zip` file. "Import entire database" reads that file and merges it into the local database with the import rules of Task 144 (US-10.4). This task gives the zip format, the binary file read and write, and the actions. Task 149 gives the dialogs and the File screen.

## Acceptance criteria

The user agreed the criteria on 2026-11-04.

- [x] The export writes one `.zip` with `manifest.json` and one `wrapper-{uuid}.json` for each league, as in the database folder (Task 76).
- [x] The export reads the live state: the Blueprints and the leagues with their unsaved changes. A league that is not loaded comes from its file on disk (US-10.4).
- [x] The import reads the `.zip`, and gives its Blueprints and leagues to the Task 144 plan steps. It merges, and never replaces the local database.
- [x] A Blueprint in the `.zip` is an entity of its own: it can be new, same, or a conflict. The Blueprints go first, then the leagues.
- [x] A `.zip` that is not a database gives an error, and imports nothing. For example: no `manifest.json`, a manifest row with no wrapper file, or a file that is not a zip.
- [x] The persistence contract gets a binary read and write. The Tauri adapter implements them.
- [x] A test exports a database and imports it into an empty one. The result is equal to the original (US-10.4).
- [x] Unit tests for the zip format and its errors. Integration tests for the export and the import.

**Out of scope:** the save and open dialogs, the default file name, the "Resolve conflicts" dialog, and the message with the counts (Task 149). Seasons, locations, and story state (MVP3, MVP4).

## Notes

- **2026-11-04:** Facts from the code and the docs.
  - Task 76 chose one `.zip` with the manifest and every wrapper file. It named fflate as an example zip library. No zip library is in `package.json` yet.
  - fflate 0.8.3 (2026-05-16) is the latest version. MIT license, no dependencies, JavaScript only.
  - `FileSystem` in `persistence/types.ts` moves text only. The Tauri capability allows the text read and write, not the binary ones (`src-tauri/capabilities/default.json`).
  - The app loads a league only when the user opens it (`PERSISTENCE.md` §2b). So the export must read the other leagues from the folder.
  - The Task 144 actions sort and add Blueprints and leagues. A league import with no embedded list adds no Blueprint.
- **2026-11-04:** Proposed choices, for the user to agree before the work starts:

  | # | Choice | Proposal | Flag |
  |---|---|---|---|
  | 1 | The zip library | fflate 0.8.3, as Task 76 named. | ⚠ A new dependency. |
  | 2 | The binary file access | Add `readBinaryFile` and `writeBinaryFile` to the `FileSystem` contract and the Tauri adapter. Add `fs:allow-read-file` and `fs:allow-write-file` to the Tauri capability. | ⚠ A change to the app permissions. |
  | 3 | A league that is not loaded | The export reads its file and checks it with the wrapper parser. It does not open the league in the store. A bad file stops the export with the parser error. | |
  | 4 | The zip checks | The zip must hold `manifest.json`, and a wrapper file for each manifest row. Another file in the zip is an error. The error starts with "This .zip file is not a Scorinator database:". | |
  | 5 | The order of the import | One plan with the Blueprint steps and the league steps, so Task 149 can show both in one "Resolve conflicts" dialog. The Blueprints import first. A Blueprint imported as new leaves the league Instances on the local Blueprint, as US-11.2 says. | |
- **2026-11-04:** The user agreed the criteria and the 5 choices.

- **2026-11-04:** Two choices made during the work, for the user to check at review:

  | # | Choice | Made | Flag |
  |---|---|---|---|
  | 6 | A folder entry in the zip | It does not count, so a zip that another tool makes with folder entries still reads. Any other extra file is an error (choice 4). | |
  | 7 | The manifest of the zip | The import reads only its Blueprints. Its installation UUID and its rows do not count: the import makes its own rows from the leagues. | |
- **2026-11-04:** The user agreed choices 6 and 7, and that the task is Done.

## Report

- **What was built:**
  - `adapters/json-io/databaseZip.ts`: `packDatabaseZip` and `unpackDatabaseZip`, with fflate 0.8.3, and the checks of choice 4.
  - `persistence/types.ts`: `readBinaryFile` and `writeBinaryFile` on `FileSystem`. The Tauri adapter implements them, and `src-tauri/capabilities/default.json` allows them.
  - `app/data/databaseZip.ts`: the map between the zip and the domain records.
  - `app/state/databaseZipActions.ts`: `exportDatabaseZip` from the live state, `planDatabaseImport`, and `importDatabase`, with the Task 144 rules.
- **Test approach:** 9 unit tests for the zip format and each error. 7 integration tests for the actions: a league that is not loaded, the unsaved changes, no open in the store, a bad file on disk, the US-10.4 round trip into an empty database, a merge with same and conflict steps, and a bad league file in the zip. The test fakes of `FileSystem` got the two new methods. 1770 tests pass.
- **Not tested:** the binary read and write in the real Tauri app. No screen calls them yet. Task 149 does, and its manual check covers them.
- **Decisions made:** choices 1 to 5 in the `PROGRESS.md` Decisions log on 2026-11-04. The user agreed choices 6 and 7 at review.
- **What is left, what is next:** Task 149 adds the dialogs, the default file name `scorinator-database-<date>.zip`, the "Resolve conflicts" dialog, and the message with the counts.
