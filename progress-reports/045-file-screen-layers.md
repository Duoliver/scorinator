# Task 45 — `FileScreen`: three-layer split

**What was built:** `FileScreen` now follows the three-layer rule from Task 42. No behaviour changed.

| File                              | Holds                                                                                  |
| --------------------------------- | -------------------------------------------------------------------------------------- |
| `features/file/FileScreen.tsx`    | The markup only, 136 lines (246 before)                                                |
| `features/file/types.ts`          | `LeagueLoad`, `FileManager`. The screen has no props, so there is no default export.   |
| `features/file/helpers.ts`        | `toLeagueOptions`, `pickDefaultLeagueSlug`, `statusClassName`                          |
| `features/file/useFileManager.ts` | The main hook: the store reads, the two selector refs, and one handler for each button |
| `features/file/useLeagueLoad.ts`  | The load, and the Replace or Cancel step when a league with the same slug is open      |
| `app/exportActions.ts` (new)      | `exportTeams` and `exportResultsBySlug`, with 7 tests                                  |

**Decisions made:**

- **The two exports moved to a new app action file, `app/exportActions.ts`.** They use stores, an `app/data` function, and the status line, so they are app actions by the Task 41 rule, like `saveActions.ts` and `loadActions.ts`. They report through the status line and never throw, the same as those files. `exportResultsBySlug` finds the league through `useLeagueStore.getState()`. Before, the screen used its subscribed list. Both give the same league.
- **The hook is `useFileManager`, with the type `FileManager`.** The name comes from the design reference, `Footballer - File Manager.dc.html`. `useFileScreen` would give a type name equal to the component name.
- **The two league selectors share one `leagueOptions` list.** Before, the screen built the same list twice.
- **Save and Save as get two handlers** (`handleSave`, `handleSaveAs`), not one handler with a flag.
- **No own folder.** `features/file/` holds one screen and no domain `types.ts`, so the screen files sit at the folder root, as in `features/standings/` and `features/fixtures/`.

**Test approach:** `app/exportActions.test.ts` (new, 7 tests, written first) covers a saved file, a canceled dialog, an error, and an unknown slug. The 27 `FileScreen` screen tests pass with no change. No hook got its own test, per the Task 42 rule. 596 tests pass.

**Docs:** the store actions rule in `docs/coding-standards.md` now lists `exportActions.ts` with the other app actions.

**What is left, what is next:** Task 46 (`StatusLine`). `FileScreen` and `AppShell` both render the status line with the same markup. Task 46 can give them one shared component.
