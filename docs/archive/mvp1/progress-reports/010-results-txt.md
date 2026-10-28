# Task 10 — Results .txt export

**Status:** Review — 2026-09-25

## What was built

A new adapter folder, `src/adapters/txt`, with one function: `serializeResultsTxt(input)`. It returns the read-only results summary from MVP1 spec §1 ("Export (.txt)") as a string. It does no disk I/O and has no UI. Task 18 adds the button and the save dialog.

The text has four parts: the league name, the setup (home advantage, points, matches played), a standings table, and every matchday with its results, byes, and matches still to play. `calculateStandings` builds the table, so the table rules live in one place.

```
Marsh Cup

Home advantage: on
Points: win 3, draw 1, loss 0
Matches played: 6 of 8

STANDINGS
Pos  Team               P  W  D  L  GF  GA  GD  Pts
  1  Ashfield Town      3  2  0  1   3   4  -1    6
  ...
RESULTS
Matchday 1
  Redbrick Athletic  0 - 1  Ashfield Town
  Bye: Salt Marsh United
```

## Test approach

15 unit tests in `resultsTxt.test.ts`. There is no disk in this module, so they follow the Task 8 and Task 9 pattern, not the filesystem integration tests that `tdd.md` reserves for `tauri-fs`. One test checks the whole output against an exact string, because the format is the deliverable. The others cover the completed flag, both `on` and `off`, the points config, joint places, the blank-name fallback, matchday order, an empty league, the file ending, determinism with no input change, and the three `RangeError` cases. One test passes a real `SavedLeague`, and the type check confirms it fits.

## Decisions made

- **New folder `adapters/txt`.** The status board allowed "or new". The name follows the format-based names of `csv` and `json-io`. `docs/module-boundaries.md` is not edited. It still lists three adapter folders, so add a `/txt` line when you agree.
- **Input shape.** `ResultsTxtInput` is a structural subset of `SavedLeague`, so a caller passes the same object it would save. It is declared in this adapter and not imported from `json-io`, so the two adapters stay independent. Task 18 calls `leagueToSaved(league, roster)` (in `app/data/leagueFile.ts`) and then `serializeResultsTxt`.
- **Format details.** The spec names no layout, and none of it is on the `CLAUDE.md` open-items list, so these are ordinary calls, made here: plain ASCII, LF line endings, no trailing spaces, and no export date or time, so the same league always gives the same text. A joint place shows the position on the first row and `-` on the rest, as the standings screen does. A match still to play shows `vs`. A blank league name shows `Untitled league`, as `ReviewStep` does.
- **Guard.** The function throws a `RangeError` for a fixture, bye, or result that names an unknown team, or a result with no fixture. A file that went through `savedToLeague` cannot hold these. This matches the `calculateStandings` precedent.

## What is left, what is next

- Task 18 wires the export: the button on the File screen, and a save dialog with a `.txt` filter. `saveTextFileWithDialog` already takes a `filters` param (Task 12 fix).
- Not in the text, by choice: player-level stats, form, and any header with a date. The spec asks only for a results summary.
- Nearby, not touched: the "Export results" placeholder on the File screen stays disabled until Task 18.
