# Task 50 — App-level smoke test

**What was built:** `src/app/smoke.test.tsx`, the end-to-end smoke test that `docs/tdd.md` asks for. It renders `AppShell` and drives the real screens with `userEvent`:

1. Create two teams on the Teams screen.
2. Create a league with both teams through the League Setup wizard.
3. Scorinate both matchdays on the Fixtures tab, until the `League completed` badge shows.
4. Save with Ctrl+S, and check the status line, the `Unsaved` badge, and the file on disk.
5. Start a new session: unmount, empty every store, and render `AppShell` again at `/`.
6. Load the save from the Leagues empty state, and compare the league record, the team names, and the standings rows with the values from before the save.

Everything is real: the stores, the `app/` actions, `app/data`, `adapters/json-io`, and `adapters/tauri-fs`, including the atomic write. Only the two Tauri plugins are fake: `@tauri-apps/plugin-fs` writes to an in-memory `Map`, and `@tauri-apps/plugin-dialog` returns one fixed path.

**Test approach:** The flow already works, so the test passed on its first full run. To prove that it can fail, I broke the save two ways in `app/data/leagueFile.ts`, one at a time: a save with no results, and a save with each OVR plus 1. The test failed both times on the league compare. I reverted both changes. The test passed 5 runs in a row, since the scores are random. Its assertions compare the state before and after the save, so they do not depend on the score. `type-check` and `lint` are clean, and 601 tests pass in 59 files.

**Decisions made:**

- **Drive the UI, not the actions.** A test that calls `addTeam`, `addLeague`, and `saveLeagueBySlug` directly would skip the screens. The refactor tasks 53 to 66 move code in `features/` too, so the test goes through the screens.
- **Fake the Tauri plugins, not `app/data` or `adapters/tauri-fs`.** This keeps the adapter code and the atomic write in the test. The other screen tests spy on `app/data`.
- **Set the start url with `history.replaceState`.** `route()` from `preact-router` does nothing while no `Router` is mounted, so it cannot reset the url between two renders. The helper `openAt` in the test file has a comment about this.

**What is left, what is next:** The test covers one league with two teams. It does not cover a bye (an odd team count), the File screen buttons, a re-scorinate, or the team CSV import. Each of these has its own screen tests already. Next: Task 51 (Prettier) and Task 52 (stale comments).
