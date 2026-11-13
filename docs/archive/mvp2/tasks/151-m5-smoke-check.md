# Task 151: M5 smoke check

**Status:** Done

## Goal

Check that M5 works end to end: the import rules, the league and Blueprint files, the database `.zip`, the final ranking, the results text and the slug list, the File screen, and the League Detail export menu. One new end-to-end test, and one manual check by the user in the real app. M5 is complete when this task is Done.

## Acceptance criteria

The user agreed the criteria on 2026-11-09.

**Automated checks:**

- [x] `npm run lint`, `npm run format:check`, `npm run type-check`, `npm test`, and `npm run build` pass. Done on 2026-11-09: 1858 tests.
- [x] A new M5 end-to-end test in `src/app/smoke.test.tsx`, beside the M1 to M4 tests, with the same fake Tauri modules (choice 1):
  1. Import teams from a CSV. Create a round-robin league in the wizard, and press Ctrl+S.
  2. In League Detail, use the export menu for the league `.json`, the results `.txt`, and the slug list `.txt`. Check that each file is on the fake disk, and that the results text has the league name.
  3. On the File screen, click "Export entire database".
  4. Start a new session with an empty database. "Import entire database" brings back the teams and the league, with the counts. The league has the same UUID and fixtures.
  5. Import the league `.json` again. The message says "already up to date", and no dialog opens.
  6. Scorinate a matchday. Import the league `.json` again. "Resolve conflicts" opens. "Import as new" gives a second league, and the first league keeps its result.
  7. Press Ctrl+S and start a new session. The dashboard shows both leagues.

**The user, in the real app (`npm run tauri:dev`, choice 2):**

| # | Area | Check |
|---|---|---|
| 1 | File | The three sections, and each export off with an empty database. |
| 2 | File | "Export all leagues" and "Export all team blueprints", then import each file into the same database: "already up to date". |
| 3 | Picker | A file with many leagues: the rows, the UUIDs, the "Conflict" tag, and a partial pick. |
| 4 | Conflicts | "Skip all", "Import all as new", a change of one row, Confirm, and Cancel. |
| 5 | Database | Export the `.zip`, then import it. Teams and leagues show in one conflict dialog after a change. |
| 6 | Errors | An MVP1 file, a teams file in "Import leagues", a league file in "Import teams", and a `.zip` that is not a database. |
| 7 | Dashboard | "Import league..." in the header and in the empty state. |
| 8 | Detail | The export menu: the three default file names. |
| 9 | Text | The results text of Groups → Bracket with a third place: the columns and the detail lines. |
| 10 | Slug list | Export a slug list, then use "Import slug list" in a new league. The teams come in the ranking order. |
| 11 | Restart | Import, press Ctrl+S, close, and start the app. Each imported item is still there. |

## Notes

- **2026-11-09:** Facts from the code. `src/app/smoke.test.tsx` holds the M1 to M4 end-to-end tests, with fake Tauri modules. The fake disk holds text only, so the test needs a binary read and write for the `.zip`.
- **2026-11-09:** Proposed choices, for the user to agree before the work starts:

  | # | Choice | Proposal | Flag |
  |---|---|---|---|
  | 1 | The end-to-end test | The seven steps above. One round-robin league is enough, because the unit tests cover each phase layout of the text. | |
  | 2 | The manual check | The 11 rows above. You checked parts of them in Tasks 149 and 150, so you can skip a row or add one. | |
- **2026-11-09:** The user agreed the criteria and choices 1 and 2.
- **2026-11-09:** The M5 end-to-end test passed on its first run, and on three runs after that.
- **2026-11-09:** The user checked the real app and agreed that the task is Done. M5 is complete.

## Report

- **What was built:** the M5 end-to-end test in `src/app/smoke.test.tsx`. The fake disk gets a binary read and write for the `.zip`. No product code changed.
- **Test approach:** one new end-to-end test, 1858 tests in total. It drives the real screens through `AppShell`: the CSV import, the wizard, Ctrl+S, the three exports of the menu, the database export, a new session with an empty database, the database import, a repeated league import, a conflict with "Import as new", and a new session with both leagues.
- **Manual check:** the user checked the real app on 2026-11-09.
- **Decisions made:** choices 1 and 2 above, in the `PROGRESS.md` Decisions log on 2026-11-09.
- **What is left, what is next:** M5 is complete. Next: M6, from Task 152 (zone tokens, Form dot tokens, and their contrast test).
