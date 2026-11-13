# Task 153: The last N results, and the places by matchday

**Status:** Done

## Goal

Two pure functions in `engine/standings`: the last N results of a team (US-12.1), and the place of each team after each matchday (US-12.4). Task 154 shows the Form column, and Task 156 draws the chart. No screen changes in this task.

## Acceptance criteria

The user agreed the criteria on 2026-11-09.

**The last N results (`getLastResults`):**

- [x] It gives up to N entries for one team, the oldest first and the newest last.
- [x] Each entry has the outcome (W, D, or L), the opponent, home or away, the goals with the team's goals first, and the matchday.
- [x] The order is the matchday order, not the order of the results. A re-scorinated match keeps its place.
- [x] A team with fewer than N matches gets fewer entries. A team with no match gets an empty list. A bye is not a match.

**The places by matchday (`getPlacesByMatchday`):**

- [x] It gives one point for each matchday with at least one result, in matchday order.
- [x] The place at a point uses the results of that matchday and of each matchday before it, by the Task 78 order, with the fixed lots.
- [x] Teams that share a place take their row order, so each point has the places 1 to N with no repeat (US-12.4).
- [x] A team with a bye or an unplayed match still has a place.

**Both:**

- [x] Both functions are pure, with unit tests, and take no RNG.

**Out of scope:** the Form column (Task 154). The chart (Task 156). The Form in the group cards (`scorinator-future-features.md` §14). The points mode (§15).

## Notes

- **2026-11-09:** Facts from the code.
  - A phase result has a `fixtureId` and no matchday. The matchday is on the fixture (Task 77).
  - `calculateStandings(teams, results, points, lotOf)` is a pure recompute, so a point on the chart is one call with the results so far.
  - A row has a `position` that repeats for a joint place, and a unique `sortOrder`.
- **2026-11-09:** Proposed choices, for the user to agree before the work starts:

  | # | Choice | Proposal | Flag |
  |---|---|---|---|
  | 1 | The input | Both functions take the fixtures and the results of the phase, and join them by `fixtureId`. The callers need no join. | |
  | 2 | A Groups phase | A result with no fixture in the given list does not count. So a caller gives the fixtures of one group with the results of the whole phase. | |
  | 3 | The shape of a result | `{ outcome: 'W' \| 'D' \| 'L', opponent, isHome, goalsFor, goalsAgainst, matchday }`. N is an argument. Task 154 holds the 5. | |
  | 4 | The shape of a point | `{ matchday, places }`, where `places` is a `Map` from each team to its place. | |
  | 5 | A place | The row number of the table, 1 to N, in place of the shared `position`. | US-12.4 asks for this. A table can show "2=" while the chart shows 2 and 3. |
- **2026-11-09:** The user agreed the criteria and the 5 choices.
- **2026-11-09:** The user agreed that the task is Done.

## Report

- **What was built:** `engine/standings/matchHistory.ts` with `getLastResults` and `getPlacesByMatchday`.
- **Test approach:** 16 unit tests: each field of a result, the three outcomes, the matchday order, the last N, an empty list, a result with no fixture, a frozen input, the running places, a matchday with no result, a shared place, the fixed lots, and a result of another group.
- **Decisions made:** choices 1 to 5 in the `PROGRESS.md` Decisions log on 2026-11-09.
- **What is left, what is next:** no screen uses the functions yet. Task 154 shows the Form column, and Task 156 draws the chart.
