# Task 109: the team roster on the Blueprints, and the database at start

**Status:** Done

## Goal

Move the team roster of the MVP1 screens to the Blueprints of the database store (US-09.1). The app opens the database folder at start (Task 76 a), and Save and the close guard include the Blueprints. MVP1 leagues stay on the MVP1 stores in this task: a Blueprint has every field of an MVP1 team, so an MVP1 league still finds its teams by slug. Task 161 moves the leagues, and Task 162 removes the MVP1 code.

## Acceptance criteria

**At start (Task 76 a, US-11.1):**

- [x] The app shell opens the database folder (`openTauriDatabaseFolder`, then `openDatabase`) once, at start.
- [x] While the database opens, the content area shows "Opening the database…". The nav stays.
- [x] When the database cannot open, the content area shows "The database could not open: <message>". No screen shows, so no action can write over a bad manifest.

**The Teams screen (US-09.1):**

- [x] The list shows the Blueprints. "Save" in the create drawer calls `addBlueprint`, so the slug is unique, with the `-2` rule (Task 75).
- [x] "Save" in the edit drawer calls `updateBlueprint`. The slug stays the same (US-09.5).
- [x] The CSV and JSON imports call `importBlueprints` (Task 75 rule, no confirm yet). The message gives the counts, for example "Imported 3 teams: 1 new, 2 updated."

**The other roster readers:**

- [x] The wizard Teams step lists the Blueprints. A team made in the wizard drawer is a Blueprint, and the wizard selects it by its real slug.
- [x] "Create league" gives the selected Blueprints to the MVP1 `addLeague`, as MVP1 teams.
- [x] The standings and the fixtures find a team name and colour by slug in the Blueprints.
- [x] The File screen team export (CSV and JSON) writes the Blueprints. The league save file writes the Blueprints of its league as MVP1 teams.
- [x] A league file load adds or updates the Blueprints of its teams with `importBlueprints`.
- [x] ~~The Leagues empty state counts the Blueprints.~~ No change needed: the empty state shows no team count. Its "Load teams..." button uses the same import as the Teams screen.

**Save and close:**

- [x] Ctrl+S saves the database when the manifest is unsaved, then the current MVP1 league, as before. The status line says what it saved.
- [x] The close guard counts unsaved Blueprints as an unsaved change ("Teams"). Save then saves the database too.

**Code:**

- [x] `teamsStore`, `teamsActions`, and `importMerge` go, with their tests. The team importers in `app/data` give the parser records, with a blank slug kept blank, to `importBlueprints`.
- [x] Each test that seeds the roster seeds the database store through one helper in `src/test/databaseRecords.ts`.
- [x] `npm run lint`, `npm run format:check`, `npm run type-check`, and `npm test` pass. The smoke test runs the full flow with the database folder.

**Out of scope:** the leagues on the v2 store, the routes by UUID, and the dashboard rows (Task 161). The removal of the MVP1 types, stores, and save files (Task 162). The Teams screen columns, the Unsaved marker, Delete, and the CSV confirm (Task 119).

## Notes

- **2026-10-29:** Facts from the code. About 50 files use the MVP1 roster (`teamsStore`, `teamsActions`, `TeamRecord`, `importMerge`), 25 of them tests. The screens read the stores directly. `TeamBlueprint` has every field of `TeamRecord` (`slug`, `name`, `colour`, `tier`), so a reader typed for `TeamRecord` takes a Blueprint with no change.
- **2026-10-29:** The user asked Claude to go on with the recommended option at each choice, and to log the choices for discussion. The criteria above were not agreed one by one. The choices are in "Choices for discussion" below.

## Choices for discussion

Claude chose each one as the recommended option, with no user answer yet.

1. **Task 109 splits in three.** A move of every screen at once leaves the tests red for a long time, and one task would be about five times the size of Tasks 104 to 108. Task 109 is the roster. New Task 161 is the leagues, the shell, and the routes by UUID. New Task 162 removes the MVP1 code. Each slice keeps the app and the tests working (Task 84: one session for each task). **User: agreed, 2026-10-29.**
2. **A gate at start.** While the database opens, and when it cannot open, the content area shows a text and no screen. A screen on a database that is not open would throw at the first action, and a save could write over a bad manifest. **User: agreed, 2026-10-29.**
3. **Ctrl+S saves the database, then the MVP1 league,** in M1 only. Task 161 makes Ctrl+S save the database only. **User: agreed, 2026-10-29.**
4. **The close guard names unsaved Blueprints "Teams"** in its list. **User: agreed, 2026-10-29.**
5. **The import message gives the counts,** because `importBlueprints` returns them. Task 119 adds the confirm before the import. **User: agreed, 2026-10-29.**
6. **The MVP1 league file load updates the Blueprints by slug,** with the Task 75 rule, in place of the MVP1 upsert. **User: agreed as a temporary gap, 2026-10-29.** The load can overwrite a newer Blueprint with older file values. Task 161 or 162 closes the gap, before the M1 smoke check: a v2 league holds its own Instances (US-09.2), and MVP2 does not load MVP1 files (US-10.3).

## Report

- **What was built:**
  - `src/app/databaseStart.ts` (new): `openAppDatabase`, called once by `useAppShell` at start. `AppShell` shows "Opening the database…" or the error in place of the screens.
  - `useTeams`, `useTeamsStep`, `useLeagueSetup`, and `useTeamLookup` read the Blueprints. Create calls `addBlueprint`, edit calls `updateBlueprint`, and the wizard selects the slug of the new Blueprint.
  - `loadActions.ts`: the team imports and the league file load call `importBlueprints`. `describeTeamImport` gives "Imported 3 teams: 1 new, 2 updated."
  - `saveActions.ts`: new `saveTeams`. Ctrl+S saves the database first, then the current league. `exportActions.ts` and the league save file read the Blueprints.
  - `closeGuard.ts`: unsaved Blueprints show as "Teams", first in the list, and Save saves them first.
  - The team importers in `app/data` give the parser records, with a blank slug kept blank.
  - Removed: `teamsStore.ts`, `teamsActions.ts`, `importMerge.ts`, and their tests.
  - `src/test/databaseRecords.ts`: `openTestDatabase`, `testUuid`, and `teamFields` for the tests.
- **Test approach:** 13 test files moved from the MVP1 roster to `openTestDatabase`, and their roster assertions now compare the four MVP1 fields (`teamFields`). New tests: 3 in `AppShell.test.tsx` (the start call, the "Opening" note, the error note), 4 in `closeGuard.test.ts` (Teams alone, Teams first, the save order, a failed Blueprint save), 4 in `saveActions.test.ts` (Ctrl+S with the database), 2 in `databaseStart.test.ts`. The smoke test now runs the real database folder code on the in-memory disk: the first start writes the manifest, Ctrl+S writes it again with the teams, and the new session gets the teams back from the database before the league load. Full suite: 845 tests pass. Lint, format check, and type check pass, with no warning.
- **Decisions made:** the six choices for discussion above. The user agreed all six on 2026-10-29, choice 6 as a temporary gap.
- **What is left, what is next:** the edit drawer still shows the MVP1 slug preview, which follows the name, but the save keeps the slug. Task 119 makes the field read only (US-09.5). Next is Task 161: the leagues on the v2 store.
