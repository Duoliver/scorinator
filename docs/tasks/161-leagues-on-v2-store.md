# Task 161: the leagues on the v2 store

**Status:** Done

## Goal

Move the leagues from the MVP1 stores and save files to the database (US-11.1, Task 76). A new league is a `LeagueWrapper` with its own Instances (US-09.2). Ctrl+S saves the whole database. Routes use the league UUID. After this task, no screen uses the MVP1 league code. Task 162 then removes it.

## Acceptance criteria

The user agreed these criteria and the six choices below on 2026-10-29.

**The wizard (US-08.8, Task 160):**

- [x] "Create league" calls the v2 `createLeague` with the UUIDs of the selected Blueprints, and opens `/leagues/<uuid>`.
- [x] Two leagues can have the same name (Task 160 choice 4). The name still needs one letter or digit, because the file names come from its slug (US-10.1).

**The dashboard:**

- [x] The cards come from the manifest rows (`currentRows`). The dashboard opens no league file.
- [x] Each card shows the name, "Round robin (two-way) · N teams · Home adv. on", and the points pill, as in MVP1. "Open standings" goes to `/leagues/<uuid>`.
- [x] An opened league with unsaved changes shows the "Unsaved" badge (`isLeagueUnsaved`).

**League Detail:**

- [x] The route is `/leagues/:uuid`. The screen calls `openLeague(uuid)`. While it reads, the screen shows "Opening the league…". For an unknown UUID, it shows "League not found." For a bad file, it shows "The league could not open: <message>".
- [x] The header, the standings, and the fixtures read phase 1 of the wrapper.
- [x] Team names and colours come from the league Instances, not from the Blueprints (US-09.2).
- [x] Scorinate, Re-scorinate, and "Scorinate matchday" call the Task 160 actions, by fixture id.

**Save and close (Task 76 b):**

- [x] Ctrl+S calls `saveDatabase` once. It writes each unsaved league, then the manifest. The status line says "Saved." or "Nothing to save.".
- [x] The close guard lists "Teams" for unsaved Blueprints, then each unsaved league by name. Save calls `saveDatabase` once.

**The File screen:**

- [x] The "Save league" and "Load league" cards go. A league saves with Ctrl+S, into the database. Task 149 (M5) builds the v2 league import and export. This closes the Task 109 choice 6 gap.
- [x] "Export results" stays. Its selector lists the manifest rows. It opens the league, then writes phase 1 as text, as in MVP1. Task 148 replaces the text format.

**Code:**

- [x] No file outside the MVP1 code imports `leagueStore`, `leagueActions`, `leagueFile`, or the league fields of `fileStore`. Task 162 removes them.
- [x] The smoke test runs the full flow on the database folder: create a league, scorinate, Ctrl+S, a new session, open the league, and see the same results.
- [x] `npm run lint`, `npm run format:check`, `npm run type-check`, and `npm test` pass.

**Out of scope:** the progress badge and phase tabs (Task 131). The Location hint (Task 157). The v2 league files (Tasks 145, 149). The removal of the MVP1 code (Task 162).

## Notes

- **2026-10-29:** Facts from the code. 34 source files and 19 test files use the MVP1 league code. An MVP1 `LeagueRecord` holds only the slug and the OVR of each team, and reads the name and colour from the Blueprints. `StandingsView` and `FixturesView` take a `LeagueRecord`. The results text adapter takes MVP1 fixtures with no id.

## Choices for discussion

| # | Choice | Effect | Undo cost |
|---|---|---|---|
| ⚠ 1 | The File screen loses "Save league" and "Load league" until Task 149 (M5). | You cannot save a league to a file you pick, or load an MVP1 league file. All leagues live in the database. | Medium |
| ⚠ 2 | League Detail shows the Instance names and colours. | A Blueprint edit no longer changes a league that exists (US-09.2). | Low |
| 3 | "Export results" stays on the File screen, with phase 1 mapped to the MVP1 text format. | You keep the text export until Tasks 148 and 150 move it to League Detail. | Low |
| 4 | League Detail opens its league on demand, with an "Opening the league…" text. | A first open shows the text for a moment. | Low |
| 5 | Ctrl+S messages: "Saved." and "Nothing to save.". | One message for the whole database. | Low |
| 6 | The wizard selection keeps the Blueprint slugs, and maps them to UUIDs at "Create league". | No visible effect. Task 120 rebuilds the selection. | Low |

The user agreed choices 1 to 6 on 2026-10-29. Claude made the choices below during the work. The user agreed choices 7 to 10 on 2026-10-29.

| # | Choice | Effect | Undo cost |
|---|---|---|---|
| ⚠ 7 | The dashboard empty state loses "Load league..." too, the same as choice 1. | The empty state offers "Create teams", "Load teams...", and "Create league". | Low |
| 8 | "Export results" selects the first league by default. MVP1 used the last league you opened. | Pick the league in the selector before the export. | Low |
| 9 | The close guard gives no prompt when only a manifest row is one save behind its league. | The league file holds the real values. The next save writes the row. | Low |
| 10 | One rule finds the current phase: `findCurrentPhase` in `app/state/currentPhase.ts`. | No visible effect. Task 128 changes the rule in this one place. | Low |

## Report

- **What was built:**
  - "Create league" calls the v2 `createLeague` and opens `/leagues/<uuid>`. `leagueNameProblem` has no taken-name check now.
  - The dashboard cards come from `currentRows`. `describeLeague` reads a manifest row.
  - League Detail opens its league with `openLeague`, with the "Opening the league…", "League not found.", and error states. `StandingsView` and `FixturesView` take a `LeagueWrapper` and read the current phase. `useTeamLookup` reads the Instances by Blueprint UUID. The score flash keys on the fixture id.
  - `saveDatabaseChanges` replaces `saveCurrentLeague`, `saveLeagueBySlug`, and `saveTeams`. Ctrl+S and the close guard call it. New `unsavedLeagues` and `isDatabaseUnsaved` in `databaseStore.ts`.
  - The File screen keeps the team cards and "Export results". `exportResults(uuid)` opens the league, then writes the current phase in the MVP1 text shape. The league load actions and `useLeagueLoad` go.
  - New `findCurrentPhase`, used by the views, the text export, `summarizeLeague`, and the Task 160 actions.
- **Test approach:** integration tests with Testing Library on the real stores and the in-memory database folder, as before. New tests: League Detail opens a league from the disk, a bad file, an unknown UUID, and the Unsaved badge until `saveDatabase`. The dashboard lists the rows and opens no league. The wizard creates two leagues with one name. Ctrl+S writes one save with the leagues and the manifest, "Nothing to save.", a failed write, and a closed database. The close guard names a new league and saves once. The export reads a league that is not open yet. `findCurrentPhase` has 2 unit tests. The smoke test now saves into the database, starts a new session, shows the card from the manifest, and opens the league with the same standings. Full suite: 803 tests pass. The count falls from 845 because the MVP1 league save and load tests go with their code. Lint, format check, type check, and `npm run build` pass.
- **Decisions made:** choices 1 to 6, agreed by the user before the work. Choices 7 to 10, Claude choices, agreed by the user at review.
- **What is left, what is next:** the MVP1 league code has no caller now, and stays for Task 162: `leagueStore`, `leagueActions`, `leagueFile`, the MVP1 save format in `adapters/json-io`, the league fields of `fileStore` and `fileActions`, the MVP1 domain types, and the `@deprecated` triple lookups. `FileCard` keeps its `footer` prop with no user. Task 162 is next, then the M1 smoke check (110).

