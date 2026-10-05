# Task 19 — Re-scorinate UI

**Status:** Done — 2026-10-01

## What was built

In `FixturesView.tsx`, a played match keeps its action button.
The button now reads `Re-scorinate`, uses the `secondary` variant, and calls `rescorinateFixture` (Task 7).
An unplayed match still shows the `primary` `Scorinate` button.
Both states use one `Button`, so the element stays in place and keyboard focus survives a click.
The action column in `FixturesView.module.css` grew from `8rem` to `9rem`.
A score also flashes in the accent colour (`--color-accent`, the main green) for 500ms when it is generated, the first time or on a re-scorinate. This was a small addition the user asked for after the review started.
`FixturesView` detects a generated score by its result object: a new object that the previous render did not hold. The flash therefore plays even when a re-scorinate draws the same score, and does not play for existing results on open or on a matchday change. A `data-flashing` attribute on the score drives the CSS, and a timer per fixture clears it.
The Standings tab needed no change: `StandingsView` recomputes from `league.results` on every render.

## Test approach

- `FixturesView.test.tsx`: the old "removes its button" case now checks that `Scorinate` becomes `Re-scorinate`.
- New case: a store result of 99-99 (far outside what the engine draws) turns into a different score on click. Exactly one score stays for the match, and the store holds one result. The result is not random.
- `LeagueDetailScreen.test.tsx`: new integration case. After a re-scorinate in Fixtures, the Standings tab no longer shows the 99 goals, and each team shows `played: 1`.
- 4 new cases for the flash, with fake timers: green at 499ms and back at 500ms after a first score, the same after a re-scorinate, every score from `Scorinate matchday`, and no flash for existing scores on open or on a matchday change.
- `type-check`, `lint`, and the full suite stay clean.
- Not verified: the layout and the look of the flash in a real browser. This sandbox has no display.

## Decisions made

Confirmed with the user before the build:

- **No confirm dialog.** MVP1 §1 says re-scorinate "simply overwrites". The confirm modal belongs to the MVP2 bracket cascade.
- **`secondary` variant for `Re-scorinate`**, as in the prototype (`Footballer - League Detail.dc.html`).
- **No dirty flag.** Task 26 owns it, and its row must cover `rescorinateFixture` too.

Judgment call: the column went to `9rem` without a browser check. The estimate for `RE-SCORINATE` in a small button is about 124 to 131 px, against 128 px before. A clip would push the button into the away-team name. The user must check this at a narrow width.

## What is left, what is next

- Manual check: open a played matchday in `npm run tauri:dev` and look at the action column.
- Not built: a re-scorinate-matchday action. The spec and the prototype have none.
- Prettier rewrapped one import and added the missing final newline in `FixturesView.tsx`. No behavior change.
- Each row's button has the same accessible name (`Scorinate` or `Re-scorinate`). A screen reader cannot tell the rows apart. This was already true for `Scorinate`, and Task 35 adds `aria-label` to the header buttons only. A separate issue.
