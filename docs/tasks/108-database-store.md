# Task 108: the database store

**Status:** Done (2026-10-29)

## Goal

Give `app/` the in-memory database: open the database folder, keep the manifest and the opened leagues in a Zustand store, track what is unsaved, and save the unsaved files, wrappers first and manifest last (Task 76 b, c, d). It also makes the installation UUID at the first start (US-11.1, Task 107 choice). This task builds and tests the store only. Task 109 wires it to the screens and the app shell.

## Acceptance criteria

**The file map (`app/data`):**

- [x] Four functions map between the domain types (Task 104) and the file types (Task 106): manifest to file, file to manifest, wrapper to file, file to wrapper. A round trip gives equal data.
- [x] `app/data` is the only place that calls `parseManifest`, `parseWrapper`, and the two serializers.

**The summary row (Task 76 d):**

- [x] `summarizeLeague(wrapper)` is a pure function. It gives the `WrapperSummary`: UUID, `'league'`, name, team count, home advantage, points, phase formats, and progress.
- [x] Progress is the current phase with its current matchday and its matchday count, or `completed` when the current phase has no unplayed fixture. In M1 the current phase is the last phase of the league. Task 128 changes this rule when phases start one by one.
- [x] Nothing sets a summary row by hand. The store computes the row of each opened league from the league.

**The random source:**

- [x] `cryptoRandomBytes` in `app/` gives bytes from `crypto.getRandomValues`, for `uuidV4` (Task 103).

**The store (`app/state/databaseStore.ts`) and its actions:**

- [x] The state holds the open status, the installation UUID, the Blueprints, the summary rows, the opened league wrappers by UUID, and the saved snapshots: one for the Blueprints, one for the rows, and one for each opened wrapper (Task 76 c).
- [x] `openDatabase(folder)` reads the manifest. With no manifest (the first start), it makes the installation UUID and an empty manifest, and saves the manifest at once, so the UUID never changes (US-11.1). With a manifest, it loads the Blueprints and the rows. A bad manifest gives the `error` status with the parser message, and loads nothing.
- [x] `openLeague(uuid)` gives the wrapper from memory when it is open. Else it reads, parses, and keeps it. A league stays in memory after the user leaves its screen (`PERSISTENCE.md` §2b). A missing or bad file rejects with the message.
- [x] Opening a league computes its row again. When the saved row is one save behind (the Task 76 crash case), the manifest is then unsaved.
- [x] `isLeagueUnsaved(uuid)` compares the wrapper with its saved snapshot by reference (MVP1 Task 26). A new league with no snapshot is unsaved.
- [x] `areBlueprintsUnsaved()` is true only for a Blueprint change, not for a row change (Task 76 edge case: the Teams marker).
- [x] `isManifestUnsaved()` is true for a Blueprint change, a new league, or a changed row.
- [x] `saveDatabase()` writes each unsaved wrapper, then the manifest when it is unsaved, with one `folder.save` call. After the write, the snapshots point at the objects that it wrote. A change made during the write stays unsaved. With nothing unsaved, it writes nothing. A failed write rejects and changes no snapshot.
- [x] The MVP1 stores and actions do not change.

**Checks:**

- [x] Unit tests for the map and `summarizeLeague`. Store tests with an in-memory `DatabaseFolder` fake for each action, as the MVP1 store tests do.
- [x] No caller changes. `npm run lint`, `npm run format:check`, `npm run type-check`, and `npm test` pass.

**Out of scope:** the v2 actions that change a Blueprint or a league, and the `lastModifiedByInstallation` stamp at each change (Task 160). The shell wiring: open at start, Ctrl+S, the close guard, the status messages, the routes by UUID (Task 109). Evicting a saved league from memory: no cap for now (`PERSISTENCE.md` §5).

## Notes

- **2026-10-29:** Facts from the code. The MVP1 stores are `teamsStore`, `leagueStore`, `fileStore` (paths, saved snapshots, status), and `leagueDraftStore`. `saveLeagueBySlug` never throws: it writes the result to the `fileStore` status. The close guard asks Save, Don't save, or Cancel. The routes use the league slug. The screens read the MVP1 stores directly.
- **2026-10-29:** The user chose: (1) Task 108 builds the v2 store next to the MVP1 stores and wires nothing. Task 109 moves the screens and the app shell together, then removes the MVP1 stores. (2) Task 108 splits in two: this task is the database store, and new Task 160 holds the v2 actions. The order is 108, 160, 109. The routes by UUID move to Task 109.
- **2026-10-29:** Claude choice in the criteria: the `lastModifiedByInstallation` stamp happens in each action that changes an entity (Task 160), not at save. The saved result is the same, and `saveDatabase` then writes the objects as they are.
- **2026-10-29:** The user asked about the performance cost of the stamp. Claude answered: none that can be measured. Each action already builds a new object, the stamp is one string field in it, and only a changed entity gets one, so it causes no extra file write. One side effect: an edit with no real change still makes a new object and an unsaved state, as in MVP1. Task 160 can skip both when no field changed. The user chose the stamp at each change, and agreed the criteria.
- **2026-10-29:** The user agreed that the task is Done.

## Report

- **What was built:**
  - `src/app/data/databaseFile.ts`: `serializeManifestRecord`, `parseManifestRecord`, `serializeLeagueWrapper`, `parseLeagueWrapper`. They copy each field by name between the domain types and the `json-io` file types.
  - `src/app/state/summarizeLeague.ts`: the pure summary row.
  - `src/app/random.ts`: `cryptoRandomBytes`.
  - `src/app/state/databaseStore.ts`: the store, plus `currentRows`, `isLeagueUnsaved`, `areBlueprintsUnsaved`, `isManifestUnsaved`. Each check takes the state, so a screen can call it inside a store selector (Task 109).
  - `src/app/state/databaseActions.ts`: `openDatabase`, `openLeague`, `saveDatabase`.
  - `src/test/databaseRecords.ts`: shared test data and an in-memory `DatabaseFolder`.
- **Test approach:** 36 new tests. `databaseFile.test.ts` (6): round trips, the file kind and version, the parser errors. `summarizeLeague.test.ts` (6): the card fields and each progress case. `databaseActions.test.ts` (24): store tests with the in-memory folder, for the first start (a fixed byte source gives a known UUID), a saved manifest, a bad manifest, a read error, each `openLeague` case with the Task 76 crash case, each unsaved check, and each `saveDatabase` case, with a change during the write and a failed write. Full suite: 811 tests pass. Lint, format check, and type check pass, with no warning.
- **Decisions made:** the split, the wiring in Task 109, and the stamp at each change, in the Notes above and in the `PROGRESS.md` Decisions log on 2026-10-29. Claude choices: `openDatabase` never throws, and sets the `error` status. `openLeague` and `saveDatabase` reject, so Task 109 picks the message and the place to show it. A row compare uses JSON text, because a row is a few small fields.
- **What is left, what is next:** no screen uses the store yet. Task 160 adds the v2 actions with the stamp. Task 109 wires the start, Ctrl+S, the close guard, and the routes by UUID, and removes the MVP1 stores.
