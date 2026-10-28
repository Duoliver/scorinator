# Task 15 — Scorination UI: scorinate one match, scorinate a full matchday

**Status:** Review — 2026-09-17

## What was built

`LeagueRecord` (`features/leagues/types.ts`) gained a `results: LeagueResult[]` field.
`LeagueResult` extends `MatchResult<string>` with a `matchday` number.
It has the same shape as `adapters/json-io/types.ts`'s `SavedResult`.
It lives in the domain layer instead.
`features/` never imports `adapters/` directly.

`app/state/leagueStore.ts` gained two actions.
`scorinateFixture(leagueSlug, fixture)` finds the league and both teams' OVR.
It applies `applyHomeAdvantage` to the home OVR when the league has it on.
It calls `scorinateMatch`, then appends the result.
It does nothing for a fixture that already has one.
`scorinateMatchday(leagueSlug, matchday)` calls `scorinateFixture` for every unplayed fixture on that matchday.
Both follow the pattern `addLeague` already set.
The engine call happens inside the store action, with a fresh seed each time.

New `features/scorination/resultLookup.ts` holds two pure helpers.
`findResult` matches a fixture to its recorded result, by the `(matchday, home, away)` triple.
`isMatchdayFullyPlayed` checks whether every fixture on a matchday has one.
`FixturesView` (Task 14) now uses both.
A played match shows its real score, with no button.
An unplayed one keeps the `vs` placeholder, plus a "Scorinate" button.
The header gained a "Scorinate matchday" button, next to Previous and Next.
It disables once the visible matchday is fully played.

While this session touched `FixturesView.tsx` and its module CSS, it found both files already truncated on disk.
The CSS ended mid-property, the component ended mid-JSX, from before this task started.
Both are now restored to valid, complete files.
The matchday-nav grouping and the `justify-content: space-between` rule from the prior session's header-alignment change stay intact.

## Test approach

`resultLookup.test.ts` is a plain unit suite, the same style as `features/leagues/leagueSummary.test.ts`.
`findResult` matches the exact triple, and nothing else.
`isMatchdayFullyPlayed` turns true only once every fixture on a matchday has a result.
It treats a matchday with zero fixtures as fully played.

`leagueStore.test.ts` gained new cases.
`scorinateFixture` appends one result, with plausible non-negative goal counts.
A second call for the same fixture does nothing.
`scorinateMatchday` scorinates every unplayed fixture on the given matchday, and none from another.
It skips a fixture that already has a result.

`FixturesView.test.tsx` gained two integration cases.
`FixturesView` itself takes `league` as a plain prop, with no store subscription of its own.
So each case renders through a small harness component instead.
That harness selects the league straight from `useLeagueStore`, the same way `LeagueDetailScreen` does in the real app.
A click on "Scorinate" turns one match's `vs` into a real score, and removes that match's button.
A click on "Scorinate matchday" scorinates every remaining match, and disables the matchday button.

## Decisions made

- **Re-scorinate stays out of this task entirely**, confirmed with the user before the build started.
  Task 15's own title names it.
  PROGRESS.md already splits it into Task 7 (engine, not started) and Task 19 (UI, blocked on Task 7).
  `scorinateFixture` and `scorinateMatchday` both skip an already-played fixture, rather than overwrite it.
- **No hook or wrapper component in `features/scorination`.**
  `FixturesView` calls `useLeagueStore` directly for the two mutation actions.
  `LeagueDetailScreen` and `LeaguesDashboardScreen` already call store selectors the same direct way.
  A hook here would only wrap two one-line selectors.
  The project's own coding standards call that kind of abstraction unneeded.
- **The home-advantage boost's exact numeric effect stays untested at the store layer.**
  `scorinateFixture` builds its own RNG from a non-injectable seed, the same way `addLeague` already does.
  A store-level test cannot force a specific score this way.
  The boost itself already has a unit test and a statistical test at the engine layer (Task 6).
  Widening `scorinateFixture`'s signature, only to reach that one assertion from a test, would be scope creep past this task.

## What is left, what is next

- Task 16 (standings) still shows a placeholder inside `LeagueDetailScreen`'s Standings tab.
  `calculateStandings` already recomputes from a full result list on every call (Task 4).
  So Task 16 needs no new engine work, only wiring `league.results` into it.
- Task 7 (re-scorinate engine) and Task 19 (re-scorinate UI) can now build on `league.results` and `findResult`.
  Neither existed before this task.
- No save-file wiring was touched. `LeagueResult` is shaped to match `SavedResult`, but no read or write path uses it yet.
