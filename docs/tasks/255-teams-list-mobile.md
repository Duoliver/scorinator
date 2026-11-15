# Task 255: the Teams list on a narrow screen

**Status:** Refactor

## Goal

On a narrow screen, the Teams screen shows one card for each team in place of the table. The user's sketch is the input: `docs/misc/teams-list-item-mobile-layout.txt`. Layout tweak, before M3 starts.

```
[ ] Team name        [ A ]
📍 Location
TRI, GRA, MSS
team-name         [ EDIT ]
```

The footer (the slug and "Edit") is a flex row with its items at the bottom, so a long slug does not push the button off the card floor.

## Acceptance criteria

The user agreed the criteria and the choices on 2026-11-15.

- [x] Below 35rem of the list width (a container query), each team row is one card: the swatch, the bold name, and the Tier badge at the end side. Then the 📍 Location line, then the trigrams with " · ", then the footer. The header row hides.
- [x] A team with no Location has no Location line. A team with no trigrams shows the trigram made from the name, muted, as in the table.
- [x] The footer has the slug at the start and "Edit" at the end, on the bottom line (`align-self: flex-end`). A long slug wraps, and "Edit" stays at the end.
- [x] One markup: below the breakpoint, the screen CSS makes each row a wrapping flex row, and `order` puts the cells in the sketch order. `Table` marks each cell `data-column="<column key>"`. Other tables do not change their look.
- [x] Above the breakpoint, the table does not change, and the pin does not show.
- [x] Tests first: the `data-column` mark, and the Location cell of the Teams screen. The look is CSS, so the user checks it in the real app. The full suite, the type check, the lint, and the format check pass.

## Notes

- **2026-11-15:** Task created by the user, from the sketch. Draft criteria and seven choices wait for the user.
- **2026-11-15:** The user answered the choices: (1) a container query at 35rem, agreed. (2) Keep " · " between the trigrams, as in the table. (3) No pin line for no Location, agreed. (4) The trigram made from the name, muted, agreed. (5) A pin that CSS can recolour, not the colour emoji: Claude proposes an inline SVG with `currentColor`. (6) "Edit" as in the table, agreed. (7) No second markup: restyle the table rows with CSS. Claude found that each row has an inline `grid-template-columns`, which a stylesheet cannot beat without `!important`. Claude proposes a flex row with `flex-wrap` and `order` below the breakpoint, where the inline grid columns do not apply, and a `data-column` mark on each `Table` cell. The revised (5) and (7) wait for the user.
- **2026-11-15:** The user agreed (7a) to (7d), to try first. (5): the 📍 emoji for now, not an SVG. Started.
- **2026-11-15:** Tests first: the `data-column` mark of `Table`, and the pin of the Location cell, failed. Then they passed.
- **2026-11-15:** Claude choices in the code, for the review:
  - (a) The cards keep the row look of the table: the same padding and the line between two rows. The list has no gap between the cards.
  - (b) The Location text keeps the row text colour. Only the pin is new.
  - (c) The Tab order stays the DOM order: the name, then "Edit". `order` changes only the look.
- **2026-11-15:** The user agreed the review, with the Claude choices (a) to (c). Commit 1. The refactor pass is next.

## Report

- **What was built:** below 35rem of list width, each row of the Teams table shows as the card of the sketch, with CSS only. `Table` marks each cell with `data-column`. The Location cell has a 📍 pin that shows only in the card. A team with no Location has no Location line. Above 35rem, the table does not change.
- **Test approach:** one unit test for the `data-column` mark, and one screen test for the pin and its `aria-hidden`. The card look is CSS, so the user checks it in the real app. The full suite passes: 2336 tests. The type check, the lint, and the format check pass.
- **Decisions made:** the user's answers to the seven choices, and the Claude choices (a) to (c), are in the notes.
- **What is left, what is next:** a live check at a narrow width. Then the next layout tweak of the user, or M3.
- **Refactor:** waits for the review.
