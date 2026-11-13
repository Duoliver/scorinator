# Task 185: no same-group tie in the first bracket round

**Status:** Done (2026-11-03)

## Goal

After a Groups phase, a first-round bracket tie must not pair two teams of one group. The seeds and the standard placement stay. When a tie has two teams of one group, its lower team swaps with the nearest lower team of another tie, from another group, if the swap makes no new same-group tie. The user found B1 v B2 and C1 v C2 in the quarter-finals at the Task 142 review, and chose this option (option 1).

## Acceptance criteria

- [x] `buildBracketTree` takes an optional group of each team. With it, no first-round tie pairs two teams of one group when a swap can avoid it.
- [x] Only the lower team of a tie (the higher seed number) moves. It swaps with the lower team of another first-round tie: the nearest seed number first, then the higher number on a draw. The swap is valid when neither tie then has two teams of one group.
- [x] The top team of each tie stays: seeds 1 and 2 still meet only in the final, seeds 1 to 4 only from the semi-finals on.
- [x] A bye tie never takes part in a swap. A tie with no valid swap stays as it is.
- [x] The seeds do not change: the Seed List shows the same numbers.
- [x] A bracket after a round robin, and a first-phase bracket, do not change.
- [x] The app passes the groups of the Groups phase before the bracket (`bracketTreeOf`). The files need no new format version.
- [x] Tests: the user case (4 groups, top 2), 2 groups, 3 groups with best-M teams and byes, a case with no valid swap, and the seeds 1 to 4 rule for 8, 16, and 32 slots.
- [x] Type check, lint, Prettier, and the full test suite pass.
- [x] The user checks a Groups → Bracket league in the real app.

## Out of scope

- A choice of the seeding method, for example fixed pairs across groups: parked in `scorinator-future-features.md` §23.
- Later rounds: a same-group tie there is normal.

## Notes

- **2026-11-03:** Task created by the user, from the Task 142 review. The user chose option 1. Task 78 noted on 2026-10-27 that a winner can meet a runner-up of its own group, because the spec had no anti-clash rule.
- **2026-11-03:** Proposed choice, for the user to agree before the work starts:

  | # | Choice | Effect | Undo cost |
  |---|---|---|---|
  | 1 ⚠ | A bracket phase stores a flag, `avoidGroupTies`, set to true when it starts. A bracket that started before this task has no flag, and keeps its pairs. The field has a default, so the format version stays 4. | A bracket with results from before keeps the right teams in its later rounds. With no flag, its next round could show teams that did not win. | Low |

- **2026-11-03:** The user agreed the criteria and choice 1.

- **2026-11-03:** Test order. The engine and app tests ran red first. Two app tests could pass with no rule, when the real results made no clash. They now build a clash on purpose.
- **2026-11-03:** To prove the tests, I broke the code in four ways: no swap, the flag ignored, the farthest seed first, and no flag at the start. The first version of the tests missed two of them. With an exact-pairs check and the fixed tests, each break fails a test.
- **2026-11-03:** The user checked the real app and agreed that the task is Done.

## Report

- **What was built:**
  - `buildBracketTree` takes an optional group map. A first-round tie with two teams of one group swaps its lower team with the nearest lower team of another tie, when the swap makes no new same-group tie.
  - A bracket phase stores `avoidGroupTies`, set when it starts. `bracketTreeOf` passes the groups of the Groups phase before a flagged bracket.
  - The files read and write the flag. The format version stays 4.
- **Test approach:** 15 new tests, 1687 tests in total.
  - Engine: the review case with the exact pairs, the nearest swap, the seeds after a swap, byes, no valid swap, no group, and 8, 16, and 32 qualifiers with the tops unchanged.
  - App: the flag at the start of a later bracket and a first-phase bracket, a made clash with the flag and with no flag.
  - Files: the flag round trip, and a flag that is not a boolean.
- **Decisions made:** choice 1, in the `PROGRESS.md` Decisions log on 2026-11-03.
- **What is left, what is next:**
  - A bracket that started before this task keeps its pairs, as choice 1 says. To see the rule, the user starts a new Groups → Bracket league.
  - Next: Task 143, the M4 smoke check.
