# Task 46 — `StatusLine`: a status change no longer renders the active screen

**What was built:** A shared `StatusLine` component reads `fileStore.status` itself. `AppShell` no longer reads `status`, so a status set or clear renders only the status line, not the whole active screen. A save or a load gave 2 extra renders of the active screen before. Now it gives none.

| File                                    | Change                                                                                                                                                               |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `features/components/StatusLine/` (new) | `StatusLine.tsx`, `types.ts` (`StatusLineProps`, `StatusLinePlacement`), `helpers.ts` (`statusClassName`), `StatusLine.module.css`, `index.ts`, and 2 tests          |
| `app/useStatusAutoClear.ts` (new)       | The clear timer, `STATUS_VISIBLE_MS` (4000). It watches the store with `useFileStore.subscribe`, not a selector, so `AppShell` does not render again.                |
| `app/AppShell.tsx`                      | Calls `useStatusAutoClear()` and renders `<StatusLine placement="sidebar" />` off the File screen. The `status` selector and the timer effect are gone.              |
| `features/file/`                        | `FileScreen` renders `<StatusLine placement="page" />`. `status` and `statusClassName` left `useFileManager`, `types.ts`, and `helpers.ts`.                          |
| CSS                                     | The two `.status` and `.statusError` rule sets moved from `AppShell.module.css` and `FileScreen.module.css` into `StatusLine.module.css`, as `.sidebar` and `.page`. |

**Decisions made:**

- **One shared component with a `placement` prop**, not a sidebar-only component. The File screen and the sidebar showed the same status with the same markup and different spacing. `features/components/` holds it, since it reads business state and two places use it.
- **The timer uses `subscribe`, not a selector.** A selector in `AppShell` would bring the extra renders back. The timer also stays in `AppShell`, which is mounted for the whole session. A timer inside `StatusLine` would stop while the sidebar line is hidden on the File screen.
- **A status set before the first render gets its timer too.** The old effect did this through its `[status]` dependency. The `subscribe` version checks `getState()` once when it starts.

**Test approach:** Tests written first. A new `AppShell` test spies on `LeaguesDashboardScreen` and checks that a status set and clear add no render. It failed before the change ("expected 4 to be 2") and passes now. A second new test checks that a new status restarts the clear timer. `StatusLine.test.tsx` checks that the line is empty with no status and shows and hides with the store. The old status tests in `AppShell` and `FileScreen` pass with no change. 600 tests pass.

**What is left, what is next:** No more tasks from the Task 42 proposal. The Ctrl+S handling in `AppShell` is the next item from the user's refactor notes.
