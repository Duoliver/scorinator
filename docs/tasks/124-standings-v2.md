# Task 124: standings v2: fixed lots, the recursive mini-league, the cross-group order, best M

**Status:** Done

## Goal

Give `engine/standings` the Task 78 order rules. A tie that stays after every football criterion goes to a fixed lot, not to the roster order. The mini-league runs again on teams that are still level. Teams from different groups get one order, and a Groups phase can pick its best M of place N + 1 (US-01.4, US-01.6, US-02.2).

## Acceptance criteria

The user agreed these criteria and choices 1 to 6 on 2026-11-01.

**Fixed lots (Task 78 rule 1):**

- [x] `calculateStandings` takes an optional lot function: one number for each team. A lower lot goes first in a tied block.
- [x] Teams level on every criterion keep the shared place: one `position`, and `-` as `positionText` after the first row (US-02.2). The lot sets only the row order.
- [x] Two equal lots fall back to the roster order.
- [x] With no lot function, the roster order applies, as in MVP1. The two current callers do not change.
- [x] `fixedLot(leagueId, teamId)` in `engine/identity` gives the lot number from two strings. The same strings always give the same number. A test checks that the order of two teams looks random over many UUID pairs: each team goes first in 45% to 55% of 2,000 pairs.

**The recursive mini-league (Task 78 rule 2):**

- [x] When a mini-league separates only some of the level teams, a new mini-league runs among the teams that are still level. It repeats until nothing changes. Then the lot applies.
- [x] A test shows a case that one pass leaves level and the recursion separates.
- [x] The MVP1 standings tests pass with no change.

**The cross-group order (Task 78 rule 3, US-01.6):**

- [x] `orderAcrossGroups(rows, lotOf?)` orders rows from different groups by points, goal difference, and goals for, each per match played, then the lot, then the input order.
- [x] `pickBestOfPlace(tables, place, m, lotOf?)` takes the row at `place` from each group table and gives the best `m` of them, in that order.
- [x] `pickBestOfPlace` throws a `RangeError` when a table has fewer rows than `place`, or when `m` is less than 0 or more than the table count.

**Not in this task:** the fit checks and the qualifier counts (Task 126). The lots in the app and the screens (Task 128, see choice 3). The zones and highlights (Task 155).

## Choices for the user

| # | Choice | Proposal | Flag |
|---|---|---|---|
| 1 | The lot input | A 4th optional argument: `calculateStandings(teams, results, pointsConfig?, lotOf?)`. `lotOf(team)` gives a number, and the lower number goes first. | |
| 2 | Where the hash lives | `fixedLot(leagueId, teamId)` in `engine/identity`: a 32-bit FNV-1a hash with a final bit mix. The engine sees only two strings, not a domain record. | ⚠ The Task 78 report says "the app computes the hash". This puts the pure hash in the engine, so it gets unit tests. The app still calls it. Agreed. |
| 3 | When the screens use the lots | Task 128 (league state with phases) passes `lotOf` to the standings. Until then, the screens and the `.txt` export keep the roster order. | ⚠ MVP1-style leagues keep the roster order until Task 128. Agreed. |
| 4 | The recursion rule | Run the mini-league again on each block that is still level, until a pass splits nothing. This is the UEFA method. | |
| 5 | Per match played | The cross-group order always divides by matches played. With equal match counts, the order is the same as with the totals. A team with 0 matches counts as 0. | |
| 6 | The last fallback across groups | Equal lots keep the input order, that is, the group order. | |

## Notes

- **2026-11-01:** Started. Facts from the code: `calculateStandings` runs one mini-league pass, then the roster order (MVP1 Task 4). Its callers are `features/standings/useStandings.ts` and `adapters/txt/resultsTxt.ts`. A `LeagueWrapper` has a permanent `uuid` (`domain/league.ts`).
- **2026-11-01:** The user agreed the criteria and choices 1 to 6.
- **2026-11-01:** The user agreed that the task is Done.

## Report

- **What was built:**
  - `fixedLot(leagueId, teamId)` in `engine/identity/lot.ts`.
  - `calculateStandings` takes an optional `lotOf` and runs the mini-league again on each block that is still level. New exported type: `LotOf`.
  - `orderAcrossGroups` and `pickBestOfPlace` in `engine/standings/crossGroup.ts`.
- **Test approach:** 24 new unit tests.
  - `standings.test.ts` (6 new): a case where one pass leaves Bravo and Charlie level and the second pass separates them. Also the lot order, equal lots, a lot that cannot move a separated team, and a custom points system.
  - `crossGroup.test.ts` (13): the criteria order, per match played, equal rates, 0 matches, the lot, the input order, no input change, best M, and the `RangeError` cases.
  - `lot.test.ts` (5): the same number for the same ids, the range, and two statistical tests over 2,000 leagues (random UUIDs, and near-equal ids such as `league-1`).
  - The 16 MVP1 standings tests pass with no change.
  - A check outside the suite: with the recursion off, the new recursion test fails.
- **Decisions made:** choices 1 to 6, in the Decisions log (2026-11-01).
- **What is left, what is next:**
  - No caller passes `lotOf` yet. Task 128 passes `fixedLot` from the league UUID and each Instance UUID (choice 3). Until then, `useStandings` and `resultsTxt` keep the roster order.
  - Task 126 uses `pickBestOfPlace` for the qualifiers and does the fit checks.
  - `docs/mvp1-to-mvp2-impact-review.md` lines 104 and 105 still name the old rules. It is a historical review, so it stays as it is.
