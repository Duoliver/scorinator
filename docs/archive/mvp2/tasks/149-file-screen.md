# Task 149: File screen

**Status:** Done

## Goal

The File screen gets its three sections: Leagues, Team Blueprints, and Database. The user can export and import each one, pick what to import from a file, and resolve each conflict (US-10.2 to US-10.4, US-11.2). The Leagues dashboard gets "Import league". The screens use the rules of Tasks 144 to 146.

## Acceptance criteria

The user agreed the criteria on 2026-11-09.

**The screen**

- [x] The File screen has the sections Leagues, Team Blueprints, and Database, with the page text of US-10.2.
- [x] Leagues has "Export all leagues" and "Import leagues".
- [x] Team Blueprints has "Export all team blueprints", "Import teams", and the quick CSV card with the US-10.2 text.
- [x] Database has "Export entire database" and "Import entire database", with the US-10.4 text.
- [x] The File screen has no results export with a league selector (US-10.6), and no plain JSON team list import (choice 6).
- [x] With no leagues, "Export all leagues" is off. With no Blueprints, "Export all team blueprints" and "Export .csv" are off.
- [x] The CSV import keeps its confirm with the counts (Task 75).

**The exports**

- [x] "Export all leagues" writes one league file with every league, also a league that is not loaded, with the unsaved changes.
- [x] "Export all team blueprints" writes one Blueprint file.
- [x] "Export entire database" writes one `.zip`, with the date in the default name.
- [x] Each export reports the path, "Export canceled.", or the error on the status line.

**The imports**

- [x] "Import leagues" and "Import teams" open a dialog for `.json`. "Import entire database" opens a dialog for `.zip`.
- [x] A file with many items opens the picker: "Found 5 in the file. Choose which to import.", one row for each item with a checkbox, its name, and its UUID. All rows start checked. "Import selected" is off with no row checked.
- [x] A file with one item skips the picker. The database import has no picker.
- [x] When the selection has conflicts, the "Resolve conflicts" dialog follows, with the US-11.2 text.
- [x] The dialog has one row for each conflict: the type, the name, the UUID, and "Skip" or "Import as new". Each row starts on Skip. "Skip all" and "Import all as new" set every row, and a row can still change.
- [x] "Confirm" applies the choices and the rest of the import. "Cancel" in the picker or the dialog changes nothing.
- [x] After the import, the status line gives the counts (choice 4).
- [x] A file that is not valid, an MVP1 file, or a wrong file shows its error, and imports nothing.

**The dashboard**

- [x] The Leagues dashboard has "Import league", which works as "Import leagues". The empty state has it too (choice 8).

**Tests and check**

- [x] Integration tests on the real stores with fake file dialogs: each path of US-10.3 and US-11.2, the "all" buttons, Cancel, and the database import with teams and leagues in one dialog.
- [x] The manual check in the real app covers the binary `.zip` read and write (Task 146 left this open).

**Out of scope:** the League Detail export menu and the results and slug list exports there (Task 150). A merge of two versions field by field. An overwrite choice.

## Notes

- **2026-11-09:** Facts from the code.
  - The rules and the file functions exist, and no screen calls them: `app/state/importActions.ts`, `app/state/databaseZipActions.ts`, `app/data/exportFile.ts`.
  - `ChecklistDialog` is the picker (Task 113). `SegmentedControl` has `hideLabel` for a conflict row (Task 138). No new primitive is necessary.
  - The plan and the apply are two calls, so the dialogs stay modal between them (Task 144 report).
  - The status line shows on each screen through `AppShell`. The File screen has its own `page` placement.
- **2026-11-09:** Proposed choices, for the user to agree before the work starts:

  | # | Choice | Proposal | Flag |
  |---|---|---|---|
  | 1 | Where the shared flow lives | The File screen and the dashboard use the same import. One hook and one dialog component in `features/components/`. The app actions go in a new `app/importFileActions.ts`, which never throws and reports on the status line, as `loadActions.ts` does. | |
  | 2 | The "Conflict" tag in the picker | The plan runs on the whole file before the picker, and the tag shows only on a real conflict. A row with the same content has no tag. | ⚠ US-10.3 says each row with a known UUID. A same-content row has no conflict, so the tag would be wrong there. |
  | 3 | The conflict row | A `md` `Modal`. The row shows a `Badge` "Team" or "League", the name, the UUID in the mono font, and a `SegmentedControl`. | The handoff has no type on the row. US-11.2 asks for it. |
  | 4 | The message texts | Leagues: "3 leagues imported. 1 imported as new. 1 skipped. 2 already up to date. 4 teams added." Teams: the same form, with "teams". Database: "Teams: 3 imported, 1 skipped. Leagues: 2 imported, 1 already up to date." The first count always shows. Other counts show when they are not zero. | |
  | 5 | A cancel in an import | No message, as the team import does today. This covers the file dialog, the picker, and the conflict dialog. | An export still says "Export canceled.". |
  | 6 | What leaves the File screen | The "Export results" card (US-10.6), and "Import JSON..." with the plain team list. The Teams screen keeps its own list import (Task 145 choice 5). | ⚠ No screen has the results export until Task 150. |
  | 7 | The default file names | `scorinator-leagues-<date>.json`, `scorinator-team-blueprints-<date>.json`, and `scorinator-database-<date>.zip` (US-10.4). | The story sets only the database name. |
  | 8 | "Import league" on the dashboard | A secondary button beside "+ New League". With no leagues, a button in the League group of the empty state. Both open the same flow. | The empty state is a Claude choice: without it, a user with no leagues has no button. |
  | 9 | "Export entire database" with an empty database | Off when the database has no Blueprints and no leagues, as the other exports do. | The story does not say. |
  | 10 | The wrong-file text for a database file | Change `Use "Import database"` to `Use "Import entire database"`, the name of the card. | ⚠ Changes a text agreed in Task 145 choice 4. |
  | 11 | After an import | The imported items stay unsaved until Ctrl+S, as each other change does. The message has no save hint. | ⚠ A user can think that the import is already on disk. The close guard still asks. |
- **2026-11-09:** The user agreed the criteria and the 11 choices.

- **2026-11-09:** Five choices made during the work, for the user to check at review:

  | # | Choice | Made | Flag |
  |---|---|---|---|
  | 12 | A card as a group | Each `FileCard` is a `group` named by its title. Two cards have the same button text, "Export .json", so a screen reader needs the card name. | |
  | 13 | The button labels | The File screen uses the handoff labels: "Import .json…", "Export .json". The database card uses ".zip", as Task 76 chose. The dashboard uses "Import league...", the form of its neighbour "Load teams...". | The app has both `…` and `...`. |
  | 14 | Dead code | `readTeamsFromJson` and `app/data/teamsJson.ts` are removed, because choice 6 took their only caller. | |
  | 15 | A design-system change | A `fullWidth` `Checkbox` stretches its label, so the "Conflict" tag sits at the row end, as in the handoff. | ⚠ One CSS rule in `design-system/`. |
  | 16 | `exportResults` | It stays in `app/exportActions.ts` with no caller, for Task 150. | |

- **2026-11-09:** The user agreed choices 12 to 16, and that the task is Done.

## Report

- **What was built:**
  - `app/data`: the save and open dialogs for the league file, the Blueprint file, and the database `.zip`. `localDate.ts` holds the shared date text.
  - `app/exportActions.ts`: `exportAllLeagues`, `exportAllBlueprints`, and `exportDatabase`. `readAllLeagues` in `app/state/databaseZipActions.ts` reads a league that is not loaded, and keeps it closed.
  - `app/importFileActions.ts`: the three `plan*FileImport` actions, `getImportRows`, and `applyFileImport` with the messages.
  - `features/components/useFileImport.ts` and `FileImportDialogs/`: the picker, the "Resolve conflicts" dialog, and the steps between them.
  - `features/file/`: the three sections. `features/leagues/LeaguesDashboardScreen/`: "Import league" in the header and the empty state.
- **Test approach:** integration tests through the screens, on the real stores, with the file dialogs faked: each path of US-10.3 and US-11.2, the "all" buttons, Cancel, a database with teams and leagues in one dialog, the disabled exports, and the dashboard button. Unit tests for the file dialogs and the messages.
- **Manual check:** the user checked the real app on 2026-11-09, with the binary `.zip` read and write, and the layout.
- **Decisions made:** choices 1 to 11 in the `PROGRESS.md` Decisions log on 2026-11-09. The user agreed choices 12 to 16 at review.
- **What is left, what is next:**
  - No screen has the results export until Task 150 (choice 6).
  - Task 150 can call `saveLeaguesFile` with one league, but the US-10.1 default name differs: `<league slug>.json`.
