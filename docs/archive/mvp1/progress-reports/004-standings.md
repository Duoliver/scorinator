# Task 4 — Standings calc (configurable points, live update)

**Status:** Done — 2026-09-04

## What was built

`src/engine/standings/` now holds the standings calculator:

- `types.ts`: `PointsConfig` (`win`, `draw`, `loss`), `MatchResult<TeamId>` (`home`, `away`, `homeGoals`, `awayGoals`), and `StandingsRow<TeamId>` (`team`, `played`, `won`, `drawn`, `lost`, `goalsFor`, `goalsAgainst`, `goalDifference`, `points`, `sortOrder`, `position`, `positionText`).
- `standings.ts`: `DEFAULT_POINTS_CONFIG` (3/1/0) and `calculateStandings(teams, results, pointsConfig?)`.
- `index.ts`: a barrel for those exports.

`calculateStandings` takes the full roster, so a team with zero played matches still gets a zeroed row, not a missing one. It takes the full result set too, not one result at a time. This is a pure recompute, not a running total. Call it again with the current results whenever a match gets scorinated or re-scorinated, and the table reflects that snapshot. The "live update" line in the spec, and the future re-scorinate step in Task 7 ("just overwrite and recalculate"), both come down to calling this function again at this layer.

A group of rows tied on points, goal difference, and goals for is resolved by `computeMiniLeague`. This builds a fresh points/goal-difference/goals-for table, only from the matches among the members of that group, using the same `pointsConfig`. This is the method UEFA, La Liga, and Serie A use for a group stage or a league placing. It replaces an earlier, narrower two-team-only head-to-head check. See "Decisions made" below for why.

## Test approach

Unit tests only, per the `engine/` row in the layer table of `tdd.md`. `standings.test.ts` covers:

1. With no results, every team gets a zeroed row, in roster order.
2. The default 3/1/0 points apply for a win, a draw, and a loss.
3. A custom `pointsConfig`, 2/1/0, overrides the default.
4. Played count, goals for and against, and goal difference track correctly across two matches for one team.
5. Sort order: points descending, then goal difference, then goals for, then the mini-league of the tied group, then roster order. Worked out by hand, then checked against the table.
6. A full points/GD/GF tie between two teams breaks on their mini-league, decided by their single played match, even against roster order.
7. A full points/GD/GF tie between two teams, with their two matches split 1-1, breaks on the goal difference inside their mini-league.
8. A full points/GD/GF tie between two teams, split 1-1 with an equal mini-league goal difference too, falls through to roster order.
9. A full points/GD/GF tie between two teams, with zero matches played between them, falls through to roster order.
10. With no results, all four teams share one `position`, in one `sortOrder`d block, and only the first gets a numeric `positionText`.
11. Goals for alone tells two teams apart, so each gets its own `position`, and every `positionText` is numeric.
12. A mini-league that resolves two teams, on points or on goal difference, is itself a footballing criterion, so it splits them into separate positions, not a shared one.
13. A genuine tie, unresolved even by the two teams' own mini-league, gives them the same `position`, with `positionText` `'-'` on the second.
14. Three fully tied teams, none of whom have played each other, share one `position` as a block, with a numeric `positionText` only on the first of the three.
15. A genuine 3-way head-to-head cycle (A beats B, B beats C, C beats A, level margins) is resolved by the mini-league among just the three of them, not split arbitrarily. The mini-league reproduces the same cycle, so the three stay one tied block, and a fourth, unrelated team stays clearly separate above and a fifth clearly separate below.
16. Recalculating with an updated result set changes the standings, the way a re-scorinate would.
17. A result that names a team outside the given roster throws.

17 new tests, and all pass, 124 total across the suite. `npm run type-check` and `npm run lint` are both clean.

## Decisions made

- **The tie-break sort order sits outside the spec.** This is an open item, flagged the same way as the range table in Task 2 and the N < 2 guard in Task 3. The spec only says points are configurable, and defaults to 3/1/0. It says nothing about how to break a tie.

  This session first chose the standard football convention: points, then goal difference, then goals for, then roster order. The user then asked for a head-to-head step ahead of roster order, checked pairwise between exactly two teams: most wins in their own matches decides, a 1-1 split or no matches falls to their aggregate goals against each other, then roster order as the final fallback. Roster order stays the last resort for now. The user flagged it for a closer look later.

- **`StandingsRow` now carries `sortOrder`, `position`, and `positionText`, at the request of the user.** `sortOrder` is the place of the row in the table, 1 upward, always unique, since roster order is the tie-break of last resort. `position` is the standings rank a user would read off the table. Rows level on every footballing criterion share one `position`, the way a real league table shows joint places. `positionText` is `position` as a string on the first row of a tied block, and `'-'` on the rest. A rendered table then does not repeat the same number down that block. The user asked for a better name than "order" for the first field. This session proposed `sortOrder`, to read clearly against `position` (the tied, footballing rank) and `positionText` (the display string). Say the word if a different name reads better.

- **Replaced the pairwise head-to-head check with a mini-league, to fix a real bug in the pairwise version.** The user asked how professional leagues resolve a head-to-head cycle among three or more tied teams, for example A beats B, B beats C, and C beats A in their own matches, with no consistent pairwise order. Two things followed from that conversation:

  First, a real bug in the original design: `assignPositions` only checked each row against the one row before it in the sort, on the assumption that "tied" is transitive. A cycle breaks that assumption. `Array.sort` has no fixed rule for a comparator with no consistent order, so a cyclic group could give a different table order across two JS engines, or across two orderings of the same roster, for the exact same season data. That is a determinism bug, not only a display one.

  Second, the standard fix real leagues use: UEFA, La Liga, and Serie A build a fresh mini-table from only the matches among the tied teams. It uses the same points-then-goal-difference-then-goals-for math, on that smaller set. This session built exactly that, in `computeMiniLeague`. It replaces `compareHeadToHead` outright, not only for the cyclic case. A mini-league's inputs are plain numbers, so comparing them is always transitive, and the old adjacent-row bug cannot recur. All 123 prior tests still passed unchanged after the rewrite, since a two-team mini-league reduces to the same ranking the old pairwise check gave for a genuine pair. One new test adds a genuine 3-way cycle, confirming the three land on one shared position instead of an arbitrary split.

  **Simplification, flagged rather than hidden:** this runs one mini-league pass per tied group. A professional competition instead recurses. If a mini-league separates part of a group but not all of it, it rebuilds a smaller mini-league from only the remainder still tied. This matters because the numbers from the first pass still include matches against the now-separated team. This task does not build that recursion, nor the further tie-breaks (fair play points, a draw of lots) a real competition falls back to after its mini-league. A group still level after one mini-league pass here shares one `position`, and falls to roster order.

- **A result for a team outside the given roster throws a `RangeError`.** The reasoning matches the N < 2 guard in Task 3: a silent skip could hide a real caller bug, such as a result that names a team removed from a league.

- **The function takes the full roster and the full result set, not incremental updates.** No running-total state lives inside `engine/standings`. At the scale MVP1 expects, a full recompute on every call is simple and correct, and it avoids keeping a mutable table in sync by hand. If this becomes a performance concern at a larger scale, that is a later optimization, not a Task 4 concern.

## What is left, what is next

- No wiring into `persistence/` or `features/` yet. This task is the pure standings function only, the same scope boundary as Tasks 2 and 3.
- Task 16, `features/standings` on the status board, is the live-view UI that calls this function after every scorinate. This task does not build that UI.
- Task 5 is next, per the status board: scorination, OVR difference plus absolute OVR plus elasticity, feeding a Poisson score. It is the first task to touch the OVR-difference-versus-absolute-OVR weighting open item from `CLAUDE.md`.
