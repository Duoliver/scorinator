# Task 164: rename `fileStore` and `fileActions` to a name for the status line

**Status:** Done

## Goal

Use one name for one thing. Since Task 162, `fileStore` holds only the status line: the one-line result of the latest save, import, or export. The store, its actions, and its names say "status line", so a reader knows what the store holds.

## Acceptance criteria

- [x] `src/app/state/fileStore.ts`, `fileActions.ts`, and `fileActions.test.ts` become `statusLineStore.ts`, `statusLineActions.ts`, and `statusLineActions.test.ts`, with `git mv`.
- [x] The names inside change: `useFileStore` to `useStatusLineStore`, `FileState` to `StatusLineState`, `FileStatus` to `StatusLineMessage`, `setFileStatus` to `setStatusLine`, `clearFileStatus` to `clearStatusLine`.
- [x] Every import, call, and code comment in `src/` uses the new names.
- [x] The examples and rules in `docs/coding-standards.md` use the new names.
- [x] No behavior changes. Old task files, old log entries, and the MVP1 archive keep the old names, because they are history.
- [x] `npm run lint`, `npm run format:check`, `npm run type-check`, and `npm test` pass.

## Notes

- **2026-11-11:** About 164 sites in 25 files in `src/`, plus `docs/coding-standards.md`. Counts: `useFileStore` 95, `setFileStatus` 41, `clearFileStatus` 11, `FileStatus` 6, `FileState` 2. Task 162 (choice 3) kept the old name and moved the rename here.
- **2026-11-11:** The user agreed choices 1 to 7. (1) The three files, with `git mv`. (2) `useStatusLineStore`, `StatusLineState`. (3) `StatusLineMessage`. (4) `setStatusLine`, `clearStatusLine`. (5) `docs/coding-standards.md` uses the new names. (6) History keeps the old names. (7) The `tone` union stays a plain string union, because it is UI state, not a data model value set (Task 184).

## Report

- **What was built:** `statusLineStore.ts`, `statusLineActions.ts`, and its test, renamed with `git mv`. The five names inside are renamed in 25 files in `src/` and in `docs/coding-standards.md`. Prettier wrapped three test files again, because the new names are longer.
- **Test approach:** no new tests, because the behavior is the same. Full suite: 2053 tests pass. Lint, format check, and type check pass.
- **Decisions made:** choices 1 to 7, agreed by the user.
- **What is left, what is next:** nothing. Next is Task 165.
