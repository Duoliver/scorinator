# Task 185: no same-group tie in the first bracket round

**Status:** Not started

## Goal

After a Groups phase, a first-round bracket tie must not pair two teams of one group. The seeds and the standard placement stay. When a tie has two teams of one group, its lower team swaps with the nearest lower team of another tie, from another group, if the swap makes no new same-group tie. The user found B1 v B2 and C1 v C2 in the quarter-finals at the Task 142 review, and chose this option (option 1).

## Acceptance criteria

- [ ] `buildBracketTree` takes an optional group of each team. With it, no first-round tie pairs two teams of one group when a swap can avoid it.
- [ ] Only the lower team of a tie (the higher seed number) moves. It swaps with the lower team of another first-round tie: the nearest seed number first, then the higher number on a draw. The swap is valid when neither tie then has two teams of one group.
- [ ] The top team of each tie stays: seeds 1 and 2 still meet only in the final, seeds 1 to 4 only from the semi-finals on.
- [ ] A bye tie never takes part in a swap. A tie with no valid swap stays as it is.
- [ ] The seeds do not change: the Seed List shows the same numbers.
- [ ] A bracket after a round robin, and a first-phase bracket, do not change.
- [ ] The app passes the groups of the Groups phase before the bracket (`bracketTreeOf`). The files need no new format version.
- [ ] Tests: the user case (4 groups, top 2), 2 groups, 3 groups with best-M teams and byes, a case with no valid swap, and the seeds 1 to 4 rule for 8, 16, and 32 slots.
- [ ] Type check, lint, Prettier, and the full test suite pass. The user checks a Groups → Bracket league in the real app.

## Out of scope

- A choice of the seeding method, for example fixed pairs across groups: parked in `scorinator-future-features.md` §23.
- Later rounds: a same-group tie there is normal.

## Notes

- **2026-11-03:** Task created by the user, from the Task 142 review. The user chose option 1. Task 78 noted on 2026-10-27 that a winner can meet a runner-up of its own group, because the spec had no anti-clash rule.
- **2026-11-03:** Proposed choice, for the user to agree before the work starts:

  | # | Choice | Effect | Undo cost |
  |---|---|---|---|
  | 1 ⚠ | A bracket phase stores a flag, `avoidGroupTies`, set to true when it starts. A bracket that started before this task has no flag, and keeps its pairs. The field has a default, so the format version stays 4. | A bracket with results from before keeps the right teams in its later rounds. With no flag, its next round could show teams that did not win. | Low |

## Report

Write this before the task goes to Review.
