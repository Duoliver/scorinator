# Task 16 — Standings table: live view

**Status:** Review — 2026-09-18

## What was built

New `features/standings/StandingsView.tsx` renders the league table for one `LeagueRecord`.
It calls `calculateStandings` (Task 4) with the team slugs, `league.results`, and `league.points`.
It uses the design-system `Table`.
Columns match the design reference: `#`, Team, P, W, D, L, GF, GA, GD, Pts.
The `#` column shows `positionText`, so a joint place shows `-` on the later rows of a tied block.
Team name and colour come from `useTeamsStore`, with the slug as fallback.
A league with no teams shows "No teams in this league yet."
A league with teams and no results shows the zero table, plus "No matches played yet."
`LeagueDetailScreen` now renders `StandingsView` in its Standings tab.
The placeholder, its CSS rule, and the unused `Card` import are gone.

Live update needs no new state.
`calculateStandings` is a pure recompute.
`LeagueDetailScreen` already re-renders with a fresh `league` when a scorinate action changes the store.

## Test approach

Integration tests with Testing Library and the real engine, per `docs/tdd.md`.
`StandingsView.test.tsx` covers:
- column headers
- ranking and the full stat line per team, from a fixed result list
- a custom points config (3/1/0 against 2/1/0)
- the `-` tied-place marker
- the slug fallback
- both empty states
- a live update, through a store harness, after `scorinateFixture`

The live-update test asserts bounds, not exact scores, because scorination is random.
`LeagueDetailScreen.test.tsx` replaces the placeholder test.
It adds one path: Fixtures tab, click Scorinate, back to Standings, both teams show P = 1.
No DOM snapshot tests.
The full suite has 328 tests (319 before). `lint`, `type-check`, and `test` are clean.

Not verified: a manual click-through in a running app. The sandbox has no display.

## Decisions made

- No open item from `CLAUDE.md` §6 was touched. No MVP3 field or zone was added.
- `Table` has no `min-width` prop. A wrapper in `StandingsView.module.css` gives the 47.5rem minimum (760px in the prototype) and scrolls sideways below it. `design-system/` is unchanged.
- The zero-result table is shown, not hidden. Users see their roster in place before the first match.
- Numeric columns are left-aligned, as in the prototype.

## What is left, what is next

- `teamDisplay` (slug to name and colour) is now copied in `FixturesView` and `StandingsView`. A shared helper in `features/components/` is a possible follow-up. Left out to keep this task small.
- `calculateStandings` throws a `RangeError` for a result that names a team outside the roster. The store cannot produce that today. A future Load (Task 17) could, if a save file is inconsistent. Task 17 should validate before it sets the store.
- Task 19 (re-scorinate UI) needs no change here. Standings recomputes from `results`, so an overwrite shows up at once.

## Addendum 2026-09-18 — matchday reset on tab switch

The user found a bug.
Fixtures, then Standings, then Fixtures again returned to Matchday 1.
Root cause: `Tabs` renders only the active tab.
`FixturesView` unmounted on each switch, so its `useState(1)` reset.
The bug is older than Task 16. The Standings tab made it visible, because there was now a second tab to switch to.

Fix: `FixturesView` gained two optional props, `initialMatchday` and `onMatchdayChange`.
This is the same uncontrolled convention as `Tabs`' `defaultTab` and `onChange`.
`LeagueDetailScreen` now holds the matchday in `useState` and feeds it back in.
The matchday does not survive a nav-away from the league.
The user did not ask for that, so it stays out of scope.

Tests: one `LeagueDetailScreen` test for the exact reported path, and one `FixturesView` test for the two new props.
The suite now has 330 tests. `lint` and `type-check` are clean.
