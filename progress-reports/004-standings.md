# Task 4 — Standings calc (configurable points, live update)

**Status:** Done — 2026-09-04

## What was built

`src/engine/standings/` now holds the standings calculator:

- `types.ts`: `PointsConfig` (`win`, `draw`, `loss`), `MatchResult<TeamId>` (`home`, `away`, `homeGoals`, `awayGoals`), and `StandingsRow<TeamId>` (`team`, `played`, `won`, `drawn`, `lost`, `goalsFor`, `goalsAgainst`, `goalDifference`, `points`, `sortOrder`, `position`, `positionText`).
- `standings.ts`: `DEFAULT_POINTS_CONFIG` (3/1/0) and `calculateStandings(teams, results, pointsConfig?)`.
- `index.ts`: a barrel for those exports.

`calculateStandings` takes the full roster, so a team with zero played matches still gets a zeroed row, not a missing one. It takes the full result set too, not one result at a time. This is a pure recompute, not a running total. Call it again with the current results whenever a match gets scorinated or re-scorinated, and the table reflects that snapshot. The "live update" line in the spec, and the future re-scorinate step in Task 7 ("just overwrite and recalculate"), both come down to calling this function again at this layer.

## Test approach

Unit tests only, per the `engine/` row in the layer table of `tdd.md`. `standings.test.ts` covers:

1. With no results, every team gets a zeroed row, in roster order.
2. The default 3/1/0 points apply for a win, a draw, and a loss.
3. A custom `pointsConfig`, 2/1/0, overrides the default.
4. Played count, goals for and against, and goal difference track correctly across two matches for one team.
5. Sort order: points descending, then goal difference, then goals for, then head-to-head, then roster order. Worked out by hand, then checked against the table.
6. A full points/GD/GF tie breaks on a single head-to-head win, even against roster order.
7. A full points/GD/GF tie, with a 1-1 head-to-head split, breaks on aggregate head-to-head goals.
8. A full points/GD/GF tie, with a 1-1 split and equal aggregate goals, falls through to roster order.
9. A full points/GD/GF tie, with zero matches played between the two teams, falls through to roster order.
10. With no results, all four teams share one `position`, in one `sortOrder`d block, and only the first gets a numeric `positionText`.
11. Goals for alone tells two teams apart, so each gets its own `position`, and every `positionText` is numeric.
12. Head-to-head, on wins or on aggregate goals, is itself a footballing criterion, so it splits two teams into separate positions, not a shared one.
13. A genuine tie, unresolved even by head-to-head, gives two teams the same `position`, with `positionText` `'-'` on the second.
14. Three fully tied teams share one `position` as a block, with a numeric `positionText` only on the first of the three.
15. Recalculating with an updated result set changes the standings, the way a re-scorinate would.
16. A result that names a team outside the given roster throws.

16 new tests, and all pass, 123 total across the suite. `npm run type-check` and `npm run lint` are both clean.

## Decisions made

- **The tie-break sort order sits outside the spec.** This is an open item, flagged the same way as the range table in Task 2 and the N < 2 guard in Task 3. The spec only says points are configurable, and defaults to 3/1/0. It says nothing about how to break a tie.

  This session first chose the standard football convention: points, then goal difference, then goals for, then roster order. The user then asked for a head-to-head step ahead of roster order: points, then goal difference, then goals for, then the result of the matches between the two tied teams (most wins; a 1-1 split or no matches falls to aggregate goals between them), then roster order as the final fallback. `compareRows` and `compareHeadToHead` in `standings.ts` are the two places to change this, and the sort-order tests would need matching updates. Roster order stays the last resort for now; the user flagged it for a closer look later.

- **`StandingsRow` now carries `sortOrder`, `position`, and `positionText`, per the user's request.** `sortOrder` is the row's place in the table, 1 upward, always unique, since roster order is the tie-break of last resort. `position` is the standings rank a user would read off the table: rows level on every footballing criterion (points, goal difference, goals for, head-to-head) share one `position`, the way a real league table shows joint places. `positionText` is `position` as a string on the first row of a tied block, and `'-'` on the rest, so a rendered table does not repeat the same number down that block. The user asked for a better name than "order" for the first field; this session proposed `sortOrder`, to read clearly against `position` (the tied, footballing rank) and `positionText` (the display string). Say the word if a different name reads better.

  A team split from another only by head-to-head, not by points, goal difference, or goals for, still gets its own distinct `position`, not a shared one. Head-to-head is itself a footballing criterion here, matching how a league that uses head-to-head as a tiebreaker does not print those two teams as "joint" in the table.

  **Known limitation, not fixed here:** the position grouping assumes the tied set of teams stays consistent (transitive) under the football-criteria comparator. With three or more teams level on points, goal difference, and goals for, a head-to-head result cycle is possible in theory, for example Team A beats Team B, Team B beats Team C, and Team C beats Team A in their own head-to-head matches. In that rare case, the comparator is not a consistent ordering for that group, and the block detection in `assignPositions` may not group or split them the way a human would expect. A correct fix needs a proper mini-league resolution among the tied group, which this task does not build. Flagging it here rather than leaving it undocumented.

- **A result for a team outside the given roster throws a `RangeError`.** The reasoning matches the N < 2 guard in Task 3: a silent skip could hide a real caller bug, such as a result that names a team removed from a league.

- **The function takes the full roster and the full result set, not incremental updates.** No running-total state lives inside `engine/standings`. At the scale MVP1 expects, a full recompute on every call is simple and correct, and it avoids keeping a mutable table in sync by hand. If this becomes a performance concern at a larger scale, that is a later optimization, not a Task 4 concern.

## What is left, what is next

- No wiring into `persistence/` or `features/` yet. This task is the pure standings function only, the same scope boundary as Tasks 2 and 3.
- Task 16, `features/standings` on the status board, is the live-view UI that calls this function after every scorinate. This task does not build that UI.
- Task 5 is next, per the status board: scorination, OVR difference plus absolute OVR plus elasticity, feeding a Poisson score. It is the first task to touch the OVR-difference-versus-absolute-OVR weighting open item from `CLAUDE.md`.
