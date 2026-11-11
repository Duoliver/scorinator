# Task 182: League card: the button at the bottom edge

**Status:** Done

## Goal

Keep the "Open standings" button of each dashboard card at the bottom edge of the card. Today, when a card in the same row is taller, the button of the shorter card sits higher than the bottom edge. The user saw it at the Task 132 review.

## Acceptance criteria

From the user's words on 2026-11-02 ("make the content of the card span flex 1, then the header is at the maximum top and the button is at the lowest bottom possible").

- [x] The card content is a column that fills the card height.
- [x] The header (the name, "Unsaved", and the progress badge) stays at the top.
- [x] The middle block (the meta line and the points pill) takes the free space (`flex: 1`).
- [x] The button sits at the bottom edge, inside the padding, also when a card in the same row is taller.

## Notes

- **2026-11-02:** Task created by User at the Task 132 review. About 20 minutes. The `Card` primitive does not change: the card is a grid item, so its height is the row height, and its content can take `height: 100%`.
- **2026-11-02:** Look check: a temporary demo page (deleted), opened in headless Chromium at 800px, with a two-line name and "Unsaved" beside a short card. Both buttons sit at the bottom edge.

## Report

- **What was built:** the card content fills the card height (`height: 100%`). A new body block holds the meta line and the points pill, with `flex: 1`. The header stays at the top, and the button sits at the bottom edge.
- **Test approach:** no new test. The change is layout only, and jsdom computes no layout. The 14 dashboard tests still pass, and the look check covers the layout.
- **Decisions made:** none beyond the user's words.
- **What is left, what is next:** nothing. The user agreed that the task is Done on 2026-11-02.
