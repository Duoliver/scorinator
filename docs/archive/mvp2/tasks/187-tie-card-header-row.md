# Task 187: The tie card title in the score header row

**Status:** Done

## Goal

A titled tie card, for example a two-legged third-place playoff, shows one header row, not two. The title goes in the blank cell above the team names, beside "L1", "L2", and "Rep". The header row gets the vertical padding of the title, so it is thinner.

## Acceptance criteria

The criteria come from the request of the user on 2026-11-04.

- [x] A titled card with score columns shows the title in the first cell of the score header row. There is no separate title row.
- [x] The score header row uses the vertical padding of the title (`--space-1`), in place of the team row height.
- [x] A titled card with one score column (a single match) keeps the title row as before.
- [x] A card with no title keeps a blank first cell in the header row. Task 188 gives titles to those ties.
- [x] A test shows the title and "L1" in one header row.
- [x] The user checks a two-legged third place and a single-match third place in the real app.

## Notes

- **2026-11-04:** Facts from the code. `TieCard.tsx` shows the title as a `<p>` row, then a header row with a blank `.name` cell and one `.head` cell for each score column. The header row uses `.row`, with `min-height: var(--space-8)`. The title uses `padding: var(--space-1) var(--space-2)`. Only the third-place tie has a title today (`helpers.ts`, `THIRD_PLACE_NAME`).
- **2026-11-04:** Two small choices, made from the request, for the user to check at review:

  | # | Choice | Made | Flag |
  |---|---|---|---|
  | 1 | The title style in the header row | The title keeps its own style: condensed, bold, and upper case. The score labels keep theirs. | |
  | 2 | Screen readers | The header row was `aria-hidden`. Now only the score labels are hidden, so a screen reader still reads the title. | |

- **2026-11-04:** The first new test passed before the change: the parent of the title was the card. The test now also checks that the parent is not the card group.
- **2026-11-04:** The user checked the real app and agreed that the task is Done, with choices 1 and 2.

## Report

- **What was built:** `TieCard.tsx` puts the title in the first cell of the score header row. A new `.headRow` class removes the team row height, and its cells take `padding-block: var(--space-1)`, the vertical padding of the title. A card with one score column keeps the title row (`.titleRow`).
- **Test approach:** two new integration tests in `BracketView.test.tsx`. A two-legged third place shows its title in the header row with "L1" and "L2". A single-match third place keeps the title row. The padding is CSS only, so the user checks it in the real app. 1690 tests pass.
- **Decisions made:** choices 1 and 2 above, in the `PROGRESS.md` Decisions log on 2026-11-04.
- **What is left, what is next:** the user checks the real app. Task 188 gives titles to the other ties.
