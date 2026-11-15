# Task 257: the Season Teams tab on a narrow screen

**Status:** Done

## Goal

On a narrow screen, the Season Teams tab shows one card for each roster team in place of the table row, as Task 255 does for the Teams list. One markup, CSS only: the row becomes a wrapping flex row below the breakpoint, and `order` puts the cells in the card order. A layout tweak, before M3 starts.

The draft card, from the cells of the roster row (choices 1 to 4):

```
[ ] Team name        [ B | 74 ]
📍 Location
TRI
Primeira Divisão, Taça Norte  [ ✎ ]
```

## Acceptance criteria

The user agreed the criteria and the five default choices on 2026-11-15: (1) the swatch, the bold name, and the Tier · OVR box on the first line. (2) A 📍 Location line, none for no Location. (3) The trigram on its own line, in mono. (4) The leagues and ✎ on the bottom line. (5) A container query at 35rem.

- [x] Below the breakpoint, each roster row is one card, in the order the user agrees (choices 1 to 4). The header row hides.
- [x] The leagues take a full-width line. The footer has the trigram at the start and "✎" at the end, on the bottom line (review change).
- [x] Above the breakpoint, the table does not change.
- [x] Tests first, for any markup change. The look is CSS, so the user checks it in the real app. The full suite, the type check, the lint, and the format check pass.

## Notes

- **2026-11-15:** Task created by the user: "something like we did for the teams list". Draft card and five choices wait for the user.
- **2026-11-15:** The user agreed 1 to 5. Started.
- **2026-11-15:** Test first: the `data-part="location"` mark of `TeamLabel` failed, then passed. The `data-column` mark of `Table` came with Task 255.
- **2026-11-15:** Claude choices in the code, for the review:
  - (a) The Location line sits in the team cell, under the name. The Tier · OVR box stays at the top end of the card, and the Location line does not run under the box.
  - (b) The pin is CSS content (`::before`), because `TeamLabel` is shared and the other places show no pin. Where the browser reads the second `content` value, a screen reader skips the pin. An older browser can read the pin name.
  - (c) The swatch sits at the top of the team cell, beside the name.
- **2026-11-15:** Review change, from the user: the leagues and the trigram switch places in the card. The leagues take a full-width line, and the trigram goes to the footer with "✎". This changes choices 3 and 4. CSS only.
- **2026-11-15:** The user agreed the review, with the Claude choices (a) to (c). The full suite (2336 tests), the type check, and the lint pass. Commit 1. The refactor pass is next.
- **2026-11-15:** The refactor pass read the diff against the review checklist. No change. One gap outside the diff, for the user to decide: two rules of the card layout repeat in `TeamsScreen.module.css` (Task 255) and `TeamsTab.module.css`: the hidden header row and the wrapping flex row. A shared CSS module in `features/components/` could hold them. No bug found.
- **2026-11-15:** The user agreed the refactor review. Done. Commit 2.

## Report

- **What was built:** below 35rem of list width, each Season roster row shows as a card, with CSS only: the swatch, the bold name, and the Tier · OVR box, then 📍 and the Location, then the leagues at full width, then the trigram with "✎" at the bottom (review change). `TeamLabel` marks its Location `data-part="location"`. Above 35rem, the table does not change.
- **Test approach:** one changed unit test for the `TeamLabel` marks. The card look is CSS, so the user checks it in the real app. The full suite passes: 2336 tests. The type check, the lint, and the format check pass.
- **Decisions made:** the five choices of the user, and the Claude choices (a) to (c), are in the notes.
- **What is left, what is next:** a live check at a narrow width. Then the next layout tweak of the user, or M3.
- **Refactor:** no change. The diff follows the checklist: the comments say why, each size is a token, no `!important`, and the TeamLabel test covers the new mark. One gap is outside the diff, in the notes.
