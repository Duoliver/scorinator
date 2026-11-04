# Task 188: A title for the final tie card

**Status:** Done

## Goal

The final tie card shows the title "Final", as the third-place card shows its title. The other ties keep no title, and a blank first cell in the header row (Task 187).

## Acceptance criteria

The user agreed the criteria on 2026-11-04.

- [x] The final tie card shows the title "Final".
- [x] The title follows the Task 187 rule. A card with score columns shows it in the header row. A card with one score column shows it in a title row.
- [x] A single-match final with a replay shows the title in a title row before the replay, and in the header row after it.
- [x] The other ties show no title.
- [x] Tests for a two-legged final, a single-match final, and a single-match final after a replay.
- [x] The user checks the final card in the real app.

## Notes

- **2026-11-04:** Task created by the user, with Task 187. The user then limited it to the final. The user is not sure about an extra row on single-match cards.
- **2026-11-04:** Facts from the code. `helpers.ts` gives a title to the third-place tie only (`THIRD_PLACE_NAME`). The final is the tie of kind `'final'`. A single-match card has no header row before the play. After a replay, it gets a header row with "L1" and "Rep". The title row and the header row both use `--space-1` padding, so a title moves between them with no change in card height.
- **2026-11-04:** Proposed choice, for the user to agree before the work starts:

  | # | Choice | Proposal | Flag |
  |---|---|---|---|
  | 1 | A single-match final | A title row, as the single-match third place has now (Task 187 choice 1). A replay then moves the title into the header row. | ⚠ Option B: no title on a single-match final. A replayed final then shows no title before the replay and no title after it, which hides "Final" on only some finals. |

- **2026-11-04:** The user agreed the criteria and choice 1. Each final card shows "Final", in all formats.
- **Out of scope:** titles for the other ties. The user parked them: `scorinator-future-features.md` §24.
- **2026-11-04:** The user checked the real app and agreed that the task is Done.

## Report

- **What was built:** `helpers.ts` maps the tie kind to a title: "Final" (`roundName(2)`) for the final, "Third-place playoff" for the third place, and no title for the other ties. `TieCard` places the title with the Task 187 rule, with no change.
- **Test approach:** 3 new unit tests in `helpers.test.ts`, one for each tie kind. A new `TieCard.test.tsx` with 2 tests: a single-match final shows "Final" in a title row, and a replayed final shows "Final" beside "L1" and "Rep". The `TieCard` tests passed before the change, because the Task 187 rule places any title. They guard the replay case. A two-legged final is the same as the two-legged third place of Task 187. 1695 tests pass.
- **Decisions made:** choice 1, in the `PROGRESS.md` Decisions log on 2026-11-04. The titles of the earlier rounds are parked in `scorinator-future-features.md` §24.
- **What is left, what is next:** the user checks the final card in the real app.
