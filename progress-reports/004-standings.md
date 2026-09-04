# Task 4 — Standings calc (configurable points, live update)

**Status:** Done — 2026-09-04

## What was built

`src/engine/standings/` now holds the standings calculator:

- `types.ts`: `PointsConfig` (`win`, `draw`, `loss`), `MatchResult<TeamId>` (`home`, `away`, `homeGoals`, `awayGoals`), and `StandingsRow<TeamId>` (`team`, `played`, `won`, `drawn`, `lost`, `goalsFor`, `goalsAgainst`, `goalDifference`, `points`).
- `standings.ts`: `DEFAULT_POINTS_CONFIG` (3/1/0) and `calculateStandings(teams, results, pointsConfig?)`.
- `index.ts`: a barrel for those exports.

`calculateStandings` takes the full roster, so a team with zero played matches still gets a zeroed row, not a missing one. It takes the full result set too, not one result at a time. This is a pure recompute, not a running total. Call it again with the current results whenever a match gets scorinated or re-scorinated, and the table reflects that snapshot. The "live update" line in the spec, and the future re-scorinate step in Task 7 ("just overwrite and recalculate"), both come down to calling this function again at this layer.

## Test approach

Unit tests only, per the `engine/` row in the layer table of `tdd.md`. `standings.test.ts` covers:

1. With no results, every team gets a zeroed row, in roster order.
2. The default 3/1/0 points apply for a win, a draw, and a loss.
3. A custom `pointsConfig`, 2/1/0, overrides the default.
4. Played count, goals for and against, and goal difference track correctly across two matches for one team.
5. Sort order: points descending, then goal difference, then goals for, then roster order. Worked out by hand, then checked against the table.
6. Recalculating with an updated result set changes the standings, the way a re-scorinate would.
7. A result that names a team outside the given roster throws.

7 new tests, and all pass, 118 total across the suite. `npm run type-check` and `npm run lint` are both clean.

## Decisions made

- **The tie-break sort order sits outside the spec.** This is an open item, flagged the same way as the range table in Task 2 and the N < 2 guard in Task 3. The spec only says points are configurable, and defaults to 3/1/0. It says nothing about how to break a tie.

  This session chose the standard football convention: points first, then goal difference, then goals for, then the position of the team in the input roster, as a final, deterministic tie-break. If the user wants a different order, `compareRows` in `standings.ts` is the one place to change it. The sort-order test would then need matching updates.

- **A result for a team outside the given roster throws a `RangeError`.** The reasoning matches the N < 2 guard in Task 3: a silent skip could hide a real caller bug, such as a result that names a team removed from a league.

- **The function takes the full roster and the full result set, not incremental updates.** No running-total state lives inside `engine/standings`. At the scale MVP1 expects, a full recompute on every call is simple and correct, and it avoids keeping a mutable table in sync by hand. If this becomes a performance concern at a larger scale, that is a later optimization, not a Task 4 concern.

## What is left, what is next

- No wiring into `persistence/` or `features/` yet. This task is the pure standings function only, the same scope boundary as Tasks 2 and 3.
- Task 16, `features/standings` on the status board, is the live-view UI that calls this function after every scorinate. This task does not build that UI.
- Task 5 is next, per the status board: scorination, OVR difference plus absolute OVR plus elasticity, feeding a Poisson score. It is the first task to touch the OVR-difference-versus-absolute-OVR weighting open item from `CLAUDE.md`.
