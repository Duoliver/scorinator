# Task 076: settle open decision 2, the database

**Status:** Done (2026-10-27)

## Goal

Decide the five open points of the MVP2 database (`src/persistence/PERSISTENCE.md`, impact review §2.3). The points are: where the database lives, what Save and Ctrl+S write, how the app tracks unsaved changes, what the manifest summary row holds, and the format of the entire-database bundle. Task 95 (File Module) builds on these choices.

## Acceptance criteria

- [ ] The user picks an answer for each of the five points (a) to (e).
- [ ] The `PROGRESS.md` Decisions log has an entry for the choices.
- [ ] The `PROGRESS.md` Open questions list no longer has decision 2.
- [ ] The report below records the choices and their effect on Task 95 and the other epics.

## Notes

- **2026-10-27:** Facts from the code and docs. `PERSISTENCE.md` fixes the layout: `manifest.json` (always loaded) and one `wrapper-{uuid}.json` for each league (loaded when opened). Save is explicit only. Each file uses temp-file-then-rename, and the manifest is written last. MVP1 Task 26 tracks an unsaved league by a snapshot compared by reference. Task 28 asks Save, Don't save, or Cancel on window close, for leagues only. A dashboard card shows the league name, an `Unsaved` badge, and the `describeLeague` text (`src/features/leagues/leagueSummary.ts`).

- **2026-10-27:** The user agreed the criteria. The user chose: (a) a fixed app data folder, (b) Save and Ctrl+S write all unsaved files, manifest last, (c) a saved snapshot for each wrapper and one for the manifest. Points (d) and (e) are open: the user wants to clarify them first.
- **2026-10-27:** (e) The user chose one `.zip` file. (d) The user wants the card to show progress: the current phase and its matchday, so the status relates to the phase. The format text needs more detail for leagues with several round-robin phases. The user asked if this is too much work. Claude proposed one pure summary function, see the report.

- **2026-10-27:** The user accepted the proposed rule for (d).

## Report

- **What was built:** no code. Decision 2 is settled.
  - **(a) Location:** a fixed folder in Tauri's app data directory. The app opens it at start, with no extra screen. One database for each installation.
  - **(b) Save and Ctrl+S:** write every wrapper with unsaved changes, then the manifest if it changed. The manifest is written last, per `PERSISTENCE.md` §3. The close prompt uses the same rule.
  - **(c) Unsaved changes:** a saved snapshot for each wrapper and one for the manifest, compared by reference, as in MVP1 Task 26. Each league card keeps its `Unsaved` badge. The Teams screen gets an `Unsaved` marker for Blueprint edits only. The close prompt checks all snapshots.
  - **(d) Summary row:** UUID, content type, name, team count, home advantage, points, phase formats, and progress. Progress is setup, the current phase with its matchday or bracket round, or completed. One pure function, for example `summarizeLeague(league)`, computes the row from the league. Nothing edits the row by hand. An opened league's card reads the live league. Any other card reads the manifest row.
  - **(e) Export entire database:** one `.zip` file with the manifest and every wrapper file. It needs a zip library, for example fflate (JS only).
- **Test approach:** none, no code changed.
- **Decisions made:** all five, logged in the `PROGRESS.md` Decisions log on 2026-10-27.
- **Effect on other tasks:**
  - **Task 95 (File Module):** the File screen has no Save league, Save as, or remembered path. Those become per-league export. The startup empty state becomes an empty-database state. Add the zip library for (e).
  - **Task 86 (League Format):** the format text for several phases, for example several round-robin phases.
  - **Task 89 (Bracket Phase):** the bracket round names for the progress text.
  - **Task 92 (Phase Transition):** the progress text, for example "Groups · Matchday 3 of 6".
- **Known edge cases, for the build tasks:**
  - A crash between the wrapper write and the manifest write leaves the row one save behind. The app computes the row again when it opens that league.
  - Each scorination makes the manifest unsaved, because the row changes. The Teams `Unsaved` marker must show only Blueprint edits, not row changes.
- **What is left, what is next:** next is decision 3 (Task 77).
