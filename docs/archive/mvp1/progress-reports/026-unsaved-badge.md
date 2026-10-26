# Task 26 — Unsaved-changes badge

**Status:** Done — review closed by the user (recorded 2026-10-05)

## What was built

`fileStore` has a new field, `savedLeagues`, and an action, `markSaved(league)`.
It keeps each league object as it was at the last save or load.
It is a reference, not a copy.
A new pure function, `isLeagueUnsaved(league, savedLeagues)`, returns `savedLeagues[league.slug] !== league`.
A league that was never saved or loaded counts as unsaved.

`saveLeagueBySlug` (`saveActions.ts`) calls `markSaved` after a successful save or Save as.
It passes the league object read before the write.
So a change made while the file was writing stays unsaved.
A cancel or an error does not call `markSaved`.
`applyLoadedLeague` (`fileActions.ts`) calls `markSaved` after the load.

An `Unsaved` badge (`Badge`, `warning` tone) shows beside the league name on each card in `LeagueList.tsx` (Leagues Dashboard) and beside the title in `LeagueDetailScreen.tsx`.

## Test approach

- `fileStore.test.ts`: `markSaved` keeps one league for each slug. `isLeagueUnsaved` is true with no saved copy, false for the same object, true for a different object with equal content, and true when only another league was saved.
- `saveActions.test.ts`: a save and a Save as mark the league saved. A cancel and an error do not. A change made inside the write stays unsaved.
- `fileActions.test.ts`: a load marks the league saved, and a changed league is unsaved until a reload.
- `leagueStore.test.ts`: a new league, a scorinate, and a re-scorinate leave a saved league unsaved. A no-op scorinate and a no-op re-scorinate keep it saved. A change to one league does not affect another.
- `LeaguesDashboardScreen.test.tsx` and `LeagueDetailScreen.test.tsx`: the badge shows for an unsaved league, goes away after `markSaved`, and comes back after a scorinate in Fixtures.
- Seven test files that reset `fileStore` now also reset `savedLeagues`, so no test leaks state into the next.
- `type-check`, `lint`, and the full suite (481 tests) stay clean.
- Not verified: the look of the badge in a real browser. This sandbox has no display.

## Decisions made

Confirmed with the user before the build:

- **Snapshot, not a flag.** The row said "a dirty flag, set by scorinate and cleared by save or load". A saved-object reference needs no hook in each action, and it fixes a race: a change during a write is not hidden by the save. The user confirmed the reference compare (`===`) and not a JSON compare.
- **A never-saved league is unsaved.** A new league shows the badge at once. Task 28 needs this, because closing the app loses it.
- **Label `Unsaved`, `warning` tone.** No prototype shows it.

Known limits of the reference compare:

- It tracks change, not content. A re-scorinate that draws the same score still marks the league unsaved.
- It needs the stores to never change a league in place. The scorinate tests would show a break.

## What is left, what is next

- Task 28 (the prompt when the window closes) can use `isLeagueUnsaved` on every league in `leagueStore`.
- A team edit on the Teams screen does not mark any league unsaved, although a save writes each league team's name, colour, and tier. This became Task 36, at the user's request. The first note about it said a save writes the whole roster. That was wrong: it writes only the league's own teams.
- The File screen does not show the badge. The row names the Dashboard and League Detail only.
- Prettier rewrapped a few unrelated lines in `saveActions.test.ts`. No behavior change.

**2026-10-05:** Task 36 was cancelled. See the `PROGRESS.md` Decisions log entry "MVP1 known gap: unsaved teams".
