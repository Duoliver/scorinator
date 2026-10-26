# Task 18 — Results export (.txt) UI

**Status:** Review — 2026-09-25

## What was built

The "Export results" card on the File screen now works. It has a league selector and an "Export TXT..." button. The button opens a save dialog filtered to `.txt`, named `<slug>-results.txt`, and writes the summary that Task 10 builds. The result goes to the shared status line: `Exported <league> results to <path>`, `Export canceled.`, or the error message.

New file `src/app/data/resultsTxt.ts` holds `exportResultsTxt(league, roster)`. It is the thin `app/` → `adapters/` seam, the same shape as `teamsCsv.ts`. It calls `leagueToSaved`, then `serializeResultsTxt`, then `saveTextFileWithDialog`. `FileScreen` calls it, and never imports an adapter.

## Test approach

- 4 unit tests for `exportResultsTxt` with a fake filesystem and dialog, the same as `teamsCsv.test.ts`: cancel writes nothing, the written text uses team names and not slugs, the dialog gets the `.txt` filter and the default name, and a team missing from the roster throws before the dialog opens.
- 6 integration tests in `FileScreen.test.tsx`, which replace the old "Coming soon" test: disabled with a hint when there are no leagues, the current league by default, the league picked in the selector, cancel, an error, and the saved path and current league stay unchanged.
- A one-off check outside the repo ran the real atomic writer against a real temp directory. It produced one file with the correct content, and no temp file was left over.
- Not verified: a click-through of the real Tauri save dialog. This sandbox has no display, the same gap as Tasks 17 and 21.

## Decisions made

- **League selector on the card.** The prototype has only a button. With several leagues open, the export needs a target. The selector follows the Save card: the current league by default, else the first. Its label is `League to export`, so it does not clash with the Save card's `League` label.
- **Button label `Export TXT...`.** It mirrors `Export CSV...`. The prototype says `Export .txt`.
- **Export leaves `fileStore` paths and the current league alone.** A summary is not a save file, so it must not change where Ctrl+S writes.
- **Export works before any match is played.** The text then shows every match as `vs`. The spec says "final results", so a stricter rule (only a completed league) is possible. Not chosen. It is your call.
- **The handler lives in `FileScreen`,** like the team export handler. No second screen uses it, and Ctrl+S does not apply. Move it to `app/` if a second consumer appears. MVP2 moves this export to the League Detail screen, which is not built here.

## What is left, what is next

- Manual check of the real save dialog in `npm run tauri:dev` on a machine with a display.
- Task 10 and this task both wait in Review. Nothing else depends on them.
