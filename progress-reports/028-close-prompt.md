# Task 28 — Unsaved-changes prompt when the window closes

**Status:** Review — 2026-10-01

## What was built

When the user closes the window, the app checks every open league with `isLeagueUnsaved` (Task 26).
With no unsaved league, the window closes with no prompt.
Otherwise a native OS dialog names the unsaved leagues and offers `Save`, `Don't save`, and `Cancel`.

- `Save` saves each unsaved league in turn. A league with no known path opens its own save dialog. The window closes only if every save works. A canceled dialog or an error keeps the window open, and the later leagues stay unsaved.
- `Don't save` closes the window.
- `Cancel`, or a dialog closed with the window button, keeps the window open.

New folder `src/adapters/tauri-window/` holds the Tauri calls: `listenForCloseRequest` wraps `getCurrentWindow().onCloseRequested`, and `askUnsavedChoice` wraps the dialog plugin's `message` with custom buttons. Outside Tauri, `listenForCloseRequest` does nothing, so the browser dev server and Vitest need no special case. It is behind a `WindowCloseAdapter` interface, so tests replace it.

New `src/app/closeGuard.ts` holds the logic: `describeUnsavedLeagues` (the dialog text), `allowWindowClose`, and `installCloseGuard`. `AppShell` installs the guard in an effect and removes it on unmount.

`saveLeagueBySlug` now resolves to a boolean: `true` when the league was written, `false` for a cancel, an error, or an unknown slug. Existing callers ignore it.

`src-tauri/capabilities/default.json` gained `core:window:allow-destroy`.
`onCloseRequested` closes the window itself after the handler, and that close calls `destroy()`, which `core:default` does not allow.
`dialog:default` already allows `message`, so the dialog needs no new permission.

## Test approach

- `closeGuard.test.ts`, with a fake adapter: no prompt when all leagues are saved or none exist. The prompt names only the unsaved leagues. `Save` saves each one in turn, and one failed or canceled save blocks the close and stops further saves. `Don't save` and `Cancel` save nothing. The handler calls `preventDefault` only when the close is blocked. The cleanup stops the listener, also when it runs before the listener is ready. A listener error goes to the status line.
- `describeUnsavedLeagues`: one league, two leagues, and a list over five names.
- `tauriWindow.test.ts`: `choiceFromLabel` maps each button label, and any other answer, to a choice.
- `saveActions.test.ts`: the boolean for a save, a canceled dialog, an error, and an unknown slug.
- `AppShell.test.tsx`: the guard installs on mount and is removed on unmount.
- `type-check`, `lint`, and the full suite (506 tests) stay clean.
- Not tested, on purpose: the real window close and the real dialog. Tauri's API does not run in jsdom, and this sandbox has no display. `tauriWindow.ts` is a thin wrapper.

## Decisions made

Confirmed with the user before the build:

- **Native OS dialog, not an in-app modal.** A modal needs a new design-system primitive, which is its own task. The dialog does not match the app style.
- **New adapter folder `adapters/tauri-window`**, as Task 10 did with `adapters/txt`. `docs/module-boundaries.md` is not edited, and still lists three adapter folders.
- **`Save` runs one league at a time**, and one cancel keeps the window open.

## What is left, what is next

- **Manual check, about 5 minutes, needed before this is Done.** Run `npm run tauri:dev`. (1) Close the window with no league: it closes with no prompt. (2) Create a league and close: the prompt shows, and `Cancel` keeps the window open. (3) Close again and choose `Don't save`: the window closes. (4) Close again and choose `Save`: a save dialog shows, then the window closes. Cancel that save dialog: the window stays open.
- **Risk:** if `core:window:allow-destroy` does not take effect, the window cannot close once the guard exists. Step 1 of the manual check finds this at once.
- A team edit does not trigger the prompt yet. Task 36 changes the `isLeagueUnsaved` call, and `allowWindowClose` then needs a one-line update.
- Prettier formatted only the new files.
