# Task 7 — Re-scorinate (overwrite and recalculate)

**Status:** Done — 2026-10-01

## What was built

`useLeagueStore` in `src/app/state/leagueStore.ts` has a new action, `rescorinateFixture(leagueSlug, fixture)`.
It draws a new score for a fixture that already has a result.
It replaces that result in place, so the order of `league.results` does not change.
It does nothing for a fixture with no result, and nothing for an unknown league slug.

Two private helpers now serve the store.
`playFixture` finds both teams, applies `applyHomeAdvantage` when the league has it on, and calls `scorinateMatch` with a fresh seed.
`isResultOf` matches a result to a fixture by the `(matchday, home, away)` triple.
`scorinateFixture` and `scorinateMatchday` use them too, so the first score and a re-scorinate use the same code path.

No engine code changed.
`scorinateMatch` already makes a score, and `calculateStandings` already recomputes the full table from `league.results` on each call (Task 4).
So "recalculate" needs no work in this task.

## Test approach

5 new unit cases in `leagueStore.test.ts`:

- The result count, the array position, and the other results stay the same.
- The exact score matches `scorinateMatch(applyHomeAdvantage(homeOvr), awayOvr, createSeededRng(seed))`, with `Math.random` mocked to a fixed value. This is the first test of the home-advantage path at the store layer. Task 15 left it untested.
- `calculateStandings` over the new results shows `played: 1` for each team and the new goals. An append instead of a replace would show `played: 2`.
- A fixture with no result stays a no-op.
- An unknown league slug stays a no-op.

`type-check`, `lint`, and the full suite (454 tests) stay clean.

## Decisions made

- **The work lives in `app/state/leagueStore`, not `engine/scorination`.**
  The engine cannot know `LeagueResult`, and the overwrite is state, not simulation.
  The status board row now says so. Confirmed with the user before the build.
- **`rescorinateFixture` on a fixture with no result is a no-op**, like `scorinateFixture` on a played fixture. Confirmed with the user.
- **One fixture only.** MVP1 §1 names a match, not a matchday. A "re-scorinate matchday" action is not built. Confirmed with the user.
- **A new roll can give the same score.** The spec says "a new outcome", and the draw is random. The store does not force a different score.
- Prettier also rewrapped one line in `loadLeague`. No behavior change.

## What is left, what is next

- Task 19 (the UI) is now unblocked. It calls `rescorinateFixture` from `FixturesView`. Check there that the Standings tab updates on a re-scorinate.
- Task 26 (the unsaved-changes badge) must also set the dirty flag in `rescorinateFixture`, not only in `scorinateFixture`.
- Not built, by design: the MVP2 bracket cascade and its confirm modal (`scorinator-mvp2.md`).
