# Task 168: the team import confirm with the counts

**Status:** Done

## Goal

Ask before a team import changes the Blueprints: "4 new, 8 updated. Continue?" (Task 75, US-10.2). `previewTeamImport` (Task 117) gives the counts.

## Acceptance criteria

The user agreed these criteria on 2026-10-30, as part of Task 119 (choice 1 split it from Task 119).

**The import confirm (Task 75, US-10.2):**

- [x] A team import reads the file, then opens the confirm "Import teams?", with the text "4 new, 8 updated. Continue?". The buttons are "Cancel" and "Import".
- [x] "Cancel" changes nothing. "Import" applies the import and shows the status line message, as today.
- [x] The confirm opens for the three import buttons: "Import teams…" on the Teams screen, the Leagues empty state, and the File screen CSV and JSON buttons.
- [x] A file read error shows in the status line, as today, with no confirm.

**Code:**

- [x] Integration tests with Testing Library for each criterion above. Unit tests for any new `app/state` action.
- [x] `npm run lint`, `npm run format:check`, `npm run type-check`, and `npm test` pass. At review, `npm run lint` showed one error from Task 172. Task 169 fixed it (see the Notes).

**Out of scope:** the File screen layout (Task 149). The team JSON parse (Task 145).

## Notes

- **2026-10-30:** Split from Task 119 (choice 1). Facts from the code are in the Task 119 notes.
- **2026-10-30:** `npm run lint` shows one error that is not from this task: `no-duplicate-imports` at `EditTeamDrawer.test.tsx:8`, in the Task 172 commit `cd226f6`. This task leaves it as it is, so the commit holds only Task 168 work. The fix is to merge the two `./EditTeamDrawer` imports. The user decides where the fix goes.
- **2026-10-30:** The user put the lint fix in Task 169. The open question is removed from `PROGRESS.md`. Task 169 is committed (`2d1a6ad`), so `npm run lint` passes.
- **2026-10-30:** The user asked at review if the import allows slugs with spaces. It does, from the MVP1 CSV import. The fix is new Task 173.
- **2026-10-30:** The user checked the import confirm in the real app, and agreed the task is Done.

## Choices for discussion

The user agreed these choices on 2026-10-30, with the Task 119 numbers.

| # | Choice | Effect | Undo cost |
|---|---|---|---|
| ⚠ 9 | The import confirm also opens on the Leagues empty state and the File screen buttons. One shared hook in `features/components/` holds the confirm. | Every team import asks first, as Task 75 says. | Low |
| 10 | A file with no team skips the confirm, and shows "The file has no teams." | No empty "0 new, 0 updated" question. | Low |

## Report

- **What was built:**
  - `app/loadActions.ts`: the team import has two steps now. `readTeamsFromFile`, `readTeamsFromCsv`, and `readTeamsFromJson` read the file and give a `TeamImportPreview` (the records and the `previewTeamImport` counts), with no change. `applyTeamImport(records)` changes the Blueprints and writes the status line. The old `importTeamsFrom*` actions are removed.
  - `features/components/useTeamImport.ts`: the shared hook of choice 9. `startImport(read)` reads the file, then holds it. `importConfirm` gives the `ConfirmDialog` props: "Import teams?", "4 new, 8 updated. Continue?", "Cancel", and "Import".
  - The Teams screen, the Leagues empty state, and the File screen CSV and JSON buttons use the hook, and mount the `ConfirmDialog`.
  - A file with no team shows "The file has no teams." and opens no confirm (choice 10).
- **Test approach:** 8 unit tests for the app actions: the counts with no change, a canceled dialog, a read error, an empty file, the CSV, JSON, and one-dialog reads, the apply, and an apply on a closed database. Integration tests with Testing Library on the Teams screen for each criterion: the confirm with "1 new, 1 updated", the Blueprints unchanged before "Import", "Import", "Cancel", a canceled file dialog, a read error with no confirm, and an empty file. The Leagues empty state and the File screen test "Import" and "Cancel" in the confirm. The hook has no own test, because the three screen tests use it. Full suite: 961 tests pass. Format check and type check pass. Lint passes on the changed files. At review, a Task 172 file had one lint error, now fixed in Task 169. The user checked the real app.
- **Decisions made:** choices 9 and 10, agreed by the user. Claude choices:
  - The import splits into a read action and an apply action in `app/loadActions.ts`, so the file waits in the screen and not in a store.
  - The hook gives the `ConfirmDialog` props, and each screen mounts the dialog itself, as the Delete confirm on the Teams screen.
  - "The file has no teams." has the `info` tone, not `error`: the file is valid.
  - The confirm has the `primary` tone: an import adds or updates, and deletes nothing.
- **What is left, what is next:** Task 173 (the slug check in the imports), then the M2 smoke check (Task 122).
