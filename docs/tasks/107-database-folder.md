# Task 107: the database folder adapter

**Status:** Done (2026-10-29)

## Goal

Give `adapters/tauri-fs` the code that implements the `DatabaseFolder` contract of Task 104 on a real folder: read the manifest, read a wrapper, and save the wrappers, then the manifest (Task 76 a and b). The folder is a fixed folder in the app data directory. Task 108 opens it at start.

## Acceptance criteria

**The folder code (`createDatabaseFolder(fs, folderPath)`):**

- [x] It returns a `DatabaseFolder` built on the `FolderFileSystem` contract, so a test can give it a real temp folder.
- [x] The files are `manifest.json` and `wrapper-{uuid}.json` in the folder (`PERSISTENCE.md` §2).
- [x] `readManifest()` gives `null` when the folder or the manifest does not exist yet. Else it gives the manifest text.
- [x] `readWrapper(uuid)` gives the wrapper text. It rejects with a clear error when the file does not exist.
- [x] `readWrapper` rejects a value that is not a UUID v4 (`isUuidV4`, Task 103). So a bad value can never point outside the folder, for example `../x`.
- [x] `save(wrappers, manifest)` makes the folder when it does not exist. It writes each wrapper, in the given order, then the manifest. Each write uses `writeTextFileAtomic` (MVP1 Task 21).
- [x] `save` with a `null` manifest writes the wrappers only, and leaves the manifest file as it is.
- [x] When a wrapper write fails, `save` stops, rejects with that error, and does not write the manifest.
- [x] `save` rejects a wrapper UUID that is not a UUID v4, before it writes any file.

**The real folder:**

- [x] A new `FolderFileSystem` contract extends `FileSystem` with `mkdir(path)`, which makes the folder and its parents, and does nothing when the folder exists. `tauriFileSystem` implements it with the Tauri `mkdir`, and the capability file gets `fs:allow-mkdir`. `FileSystem` does not change, so the MVP1 test mocks do not change.
- [x] `openTauriDatabaseFolder()` gives the `DatabaseFolder` for the fixed folder `database/` inside the Tauri `appDataDir()`. It has no test, because it needs Tauri. Task 110 checks it in the app.

**Checks:**

- [x] Integration tests against a real temp folder, with Node `fs`, as `atomicWrite.test.ts` does (`docs/tdd.md`). A test records the order of the disk writes and shows the manifest is last. A test makes the second wrapper write fail, and shows that the first wrapper is on disk and the manifest is unchanged.
- [x] No caller changes. `npm run lint`, `npm run format:check`, `npm run type-check`, and `npm test` pass.

**Out of scope:** the JSON content (Task 106). The installation UUID and the first manifest: Task 108 makes them (user choice, below). Opening the database at start, Save, Ctrl+S, and the unsaved snapshots (Task 108). A wrapper delete: MVP2 has no league delete yet.

## Notes

- **2026-10-29:** Facts from the code. `adapters/tauri-fs` has `writeTextFileAtomic` (temp file, then rename, then cleanup on error), the dialog helpers, and `tauriFileSystem`. `FileSystem` has no `mkdir`. The capability file allows `fs:scope` `**`, but not `mkdir`. The app identifier is `com.duoliver.scorinator`, so Tauri `appDataDir()` gives a folder for that identifier. MVP1 has no league delete.
- **2026-10-29:** Claude proposed the criteria above, with two choices for the user.
- **2026-10-29:** The user agreed the criteria and chose: (1) the installation UUID moves to Task 108. At the first start, `readManifest` gives `null`. Task 108 then makes the UUID, builds an empty manifest, and saves it at once, so the UUID never changes. This adapter knows no manifest field. (2) The folder is `database/` inside the Tauri app data folder, so other app files can sit apart from the database later.
- **2026-10-29:** Claude change to one criterion: `mkdir` goes in a new `FolderFileSystem` contract, not in `FileSystem`. Eight MVP1 test files build a `FileSystem` mock, and a new required method would break each one.
- **2026-10-29:** The user agreed that the task is Done.

## Report

- **What was built:** `src/adapters/tauri-fs/databaseFolder.ts` (new) with `createDatabaseFolder(fs, folderPath)`, the `DatabaseFolder` on a real folder. `src/adapters/tauri-fs/tauriDatabaseFolder.ts` (new) with `openTauriDatabaseFolder()`, for `database/` in the Tauri app data folder. `FolderFileSystem` in `src/persistence/types.ts`. `tauriFileSystem` implements `mkdir`, and `src-tauri/capabilities/default.json` allows `fs:allow-mkdir`.
- **Test approach:** integration tests on a real temp folder with Node `fs`, 13 new, in `databaseFolder.test.ts`. They cover: `null` with no folder and with no manifest, the wrapper read, the missing file error, the UUID check on read and on save (with no file written), the folder made at the first save, the write order (a log of each finished rename shows the wrappers in order, then the manifest), an overwrite, a `null` manifest with and without an old manifest, and a failed second wrapper write (the first wrapper is on disk, the manifest is unchanged). `openTauriDatabaseFolder` has no test, because it needs Tauri: Task 110 runs it in the app. Full suite: 775 tests pass. Lint, format check, and type check pass, with no warning.
- **Decisions made:** the two user choices and the `FolderFileSystem` change, in the Notes above and in the `PROGRESS.md` Decisions log on 2026-10-29. Claude choices: `save` with no wrapper and a `null` manifest does nothing, and does not make the folder. File paths use `/` between the folder and the file name. Tauri accepts `/` on Windows too, but no test checks Windows.
- **What is left, what is next:** no caller uses the new code yet. Task 108 opens the folder at start, makes the installation UUID and the first manifest, and wires Save and Ctrl+S. Task 110 checks the real folder in the app.
