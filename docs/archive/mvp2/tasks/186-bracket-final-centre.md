# Task 186: Centre the final column of the bracket

**Status:** Done

## Goal

In the Bracket tab, the final column puts its ties at the vertical centre. The earlier rounds then look as if they meet in the final. The other columns keep their current spacing.

## Acceptance criteria

- [x] The ties of the final column use `justify-content: center`.
- [x] The other round columns keep `justify-content: space-around`.
- [x] The third-place tie stays under the final (US-04.12), as choice 1 says.
- [x] The user checks the Bracket tab in the real app, with and without a third place.

## Notes

- **2026-11-04:** Facts from the code. `src/features/bracket/BracketView/BracketView.module.css` gives `.ties` the rule `justify-content: space-around` for each column. The final round is always the last column. It holds the final, and the third-place tie under it when that setting is on.
- **2026-11-04:** Proposed choices, for the user to agree before the work starts:

  | # | Choice | Proposal | Flag |
  |---|---|---|---|
  | 1 | The final with a third-place tie | Centre the two cards as one group. The final sits a little above the centre line, and the third place sits under it. | ⚠ The final is not on the exact centre line. Option B: an empty space above the final, as tall as the third-place card, so the final is on the exact centre line. That costs more CSS. |
  | 2 | How the final column gets the rule | A `final` class on the last column, from `BracketView`. A test can find the class. | A CSS `:last-child` selector also works, with no change to the markup, but a test cannot check it in jsdom. |

- **2026-11-04:** The user agreed choice 1 as proposed: the final sits a little above the centre with a third place. That is better than the final at the top. The user chose `:last-child` for choice 2. The test criterion goes, because jsdom does not apply the CSS rule. A class test is also low value, as `docs/tdd.md` says for `features/`.
- **2026-11-04:** The user checked the real app and agreed that the task is Done.

## Report

- **What was built:** one CSS rule in `src/features/bracket/BracketView/BracketView.module.css`. `.column:last-child .ties` uses `justify-content: center`. The other columns keep `space-around`.
- **Test approach:** no new test (choice 2). The user checks the result in the real app. The full checks pass with no change in the test count.
- **Decisions made:** choices 1 and 2, in the `PROGRESS.md` Decisions log on 2026-11-04.
- **What is left, what is next:** the user checks the Bracket tab in `npm run tauri:dev`.
