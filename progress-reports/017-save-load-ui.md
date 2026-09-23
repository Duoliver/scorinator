# Task 17 — Save/Load UI

**Status:** Review — 2026-09-18

## What was built

A new **File** screen (`features/file`) and a system-wide **Ctrl+S**.

The File screen follows the design reference, with five cards:
- **Save league.** A league selector (the current league by default), **Save**, and **Save as...**.
- **Load league.** **Load...** reads a save file. If a league with the same slug is open, an inline confirm asks before it replaces that league.
- **Import teams.** **Import CSV...** and **Import JSON...**, moved from the Teams screen.
- **Export teams.** **Export CSV...**, moved from the Teams screen.
- **Export results.** A disabled button and a "Coming soon." note. Task 18 fills it in.

Ctrl+S (Cmd+S on macOS) saves the current league from any screen.
The current league is the last one created, opened in League Detail, or loaded.
The first save opens the Save dialog. Later saves write to the same file with no dialog.
With no current league, the status line says "No league to save. Open or create a league first."
Ctrl+Shift+S is not bound. A held key saves once.

Every save or load result shows in one status line.
It is in the sidebar, or inline on the File screen, so it never shows twice. It clears after 4 seconds.

New code:
- `app/data/leagueFile.ts`: `leagueToSaved`, `savedToLeague`, `saveLeagueFile`, `saveLeagueFileAs`, `loadLeagueFile`.
- `app/saveActions.ts`: `saveLeagueBySlug` and `saveCurrentLeague`, shared by Ctrl+S and the File screen.
- `app/state/fileStore.ts`: current league, last saved path per league, status line.
- `leagueStore.loadLeague`: replaces the league with the same slug in place, or appends.
- `AppShell`: the `/file` route, the File nav item, the key handler, the status line.

Removed: the Import CSV, Import JSON, and Export CSV buttons and handlers from `TeamsScreen`.
`importMerge.ts` and its test moved from `features/teams` to `features/file`.

## Test approach

Per `docs/tdd.md`:
- `leagueFile.test.ts` is a unit suite with a fake `FileSystem` and dialog, in the style of `teamsCsv.test.ts`. It covers the round trip, each cross-reference failure, known path against dialog, cancel, and Save as.
- `saveActions.test.ts`, `fileStore.test.ts`, and the `leagueStore.test.ts` additions cover the state logic.
- `FileScreen.test.tsx` is a Testing Library integration suite. The data layer is mocked at the `app/data` seam, as in the old Teams tests. It covers save, load with and without a clash, a bad file, the moved import and export cases, and the placeholder card.
- `AppShell.test.tsx` covers the File route, Ctrl+S (Ctrl, Meta, ignored keys, held key, default blocked), and the status line, with fake timers for the 4 second clear.
- `LeagueDetailScreen.test.tsx` covers setting the current league.
- The suite went from 342 to 407 tests. `lint` and `type-check` are clean.

**Not verified:** a real click-through of the save and open dialogs. The sandbox has no display.
This is the check Task 21 left open. To run it, use `npm run tauri:dev`:
1. Create teams and a league, and scorinate two matches.
2. Press Ctrl+S. The Save dialog opens. Pick a path.
3. Scorinate again and press Ctrl+S. No dialog. The file changes on disk.
4. On the File screen, click Load and pick the file. The confirm appears. Click Replace.
5. Restart the app. Load the file. Check Standings and Fixtures.

## Decisions made

See the 2026-09-18 Task 17 entry in the Decisions log. In short:
- Ctrl+S saves the current league, from any screen. The user chose this.
- The path per league lives in `fileStore`, not on `LeagueRecord`.
- Load validates cross-references, which `parseLeague` skips. A bad file fails with a readable message and changes nothing.
- The replace confirm is inline, not a native dialog.
- Save as is a small addition, so a saved league can move to another file.
- Team import and export moved off Teams. The user asked for this.
- The status line clears after 4 seconds. There is no toast primitive, and none was added.

## What is left, what is next

- Tasks 26, 27, and 28 are on the board (unsaved badge, Teams shortcut, close prompt).
- Task 18 (Export results UI) fills in the placeholder card.
- The status line is easy to miss if the user looks away within 4 seconds. A persistent last-saved indicator could come with Task 26.
- After a load, the app stays on the File screen. Opening the loaded league in League Detail could be a follow-up.
- Import teams still merges by slug and overwrites a same-slug team. That was already so for CSV. A loaded league's teams follow the same rule, so a load can change a roster team's name or colour.

## Review tweaks

- 2026-09-23: The user found the league selector on Save league too narrow. The selector now sits above the Save and Save as buttons, at the same width as the button row. The buttons keep their own widths, and their labels do not wrap. Before this, the card squeezed the row and broke "Save as..." onto two lines. A long league name does not widen the stack. The empty state uses the same stack, with the hint in place of the selector.
- 2026-09-23: On a narrow card, the controls go under the title and description. A container query on `FileCard` does this below a card width of 40rem. It replaces the flex wrap, at the request of the user. The controls now fill that line and sit at the end. On Save league, the selector then spans the full width, with the buttons at the end. The change is in `FileCard`, so all File cards act the same way.
- 2026-09-23: The Save league selector was narrow on a wide card. `FileCard` has a new `input` prop for a card that needs a value from the user before its controls act. The input and the controls share a row under the text, and the input takes the free width. Below 40rem, the input and the controls stack, as on the other cards. Save league uses this prop, so the `saveControls` styles in `FileScreen.module.css` are gone.
- 2026-09-23: The Save and Save as buttons now use `size="md"`, the Button size that matches the selector height. The Load button also uses `size="md"`.
