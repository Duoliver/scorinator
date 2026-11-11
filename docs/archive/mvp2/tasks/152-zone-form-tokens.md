# Task 152: Zone tokens, Form dot tokens, and their contrast test

**Status:** Done

## Goal

The colour tokens for the four position zones (US-12.5) and the Form dots (US-12.1), with a contrast test. Tasks 154 and 155 use them. No screen changes in this task.

## Acceptance criteria

The user agreed the criteria on 2026-11-09.

- [x] `tokens.css` and `tokens.ts` have a colour and a tint for each zone: green, blue, yellow, and red (choice 1).
- [x] `tokens.css` and `tokens.ts` have a colour for each Form dot: win, draw, and loss, and one colour for the dot letter (choice 2).
- [x] `tokens.sync.test.ts` checks each new token.
- [x] The contrast test checks the body text on each tint at 7:1 (AAA), and the dot letter on each dot at 7:1 (AAA).
- [x] The contrast test checks each zone colour on its tint at 3:1, the WCAG level for a graphic that is not text (choice 3).

**Out of scope:** the Form column (Task 154). The tint, the stripe, and the legend on the tables (Task 155). The removal of `--color-row-positive` and `--color-row-caution`, which Task 155 replaces.

## Notes

- **2026-11-09:** Facts from the code.
  - `tokens.ts` mirrors `tokens.css` for the contrast test. `tokens.sync.test.ts` compares a hex value, so a new token cannot be a `var()` alias.
  - The current row tints are `#EAF3EA` (green) and `#FBF3D6` (yellow). Task 132 added them.
  - `--color-fg-muted` reaches only 5.6:1 to 6.0:1 on these tints. It is already outside the AAA pairs (`docs/design-reference/README.md`). US-12.5 asks for AAA text on a tint, so Task 155 must use `--color-fg` in a zone row.
- **2026-11-09:** Proposed choices, for the user to agree before the work starts:

  | # | Choice | Proposal | Flag |
  |---|---|---|---|
  | 1 | The zone values | Green `#17551C` on `#EAF3EA`. Blue `#1565C0` on `#E3EEF9`. Yellow `#9A7400` on `#FBF3D6`. Red `#8C1414` on `#F9E6E6`. Body text on the tints: 14.5:1 to 15.7:1. | The green and red colours and the green and yellow tints are values the app already has. |
  | 2 | The Form dot values | Win `#17551C`, draw `#545454`, loss `#8C1414`, with a white letter: 8.9:1, 7.6:1, and 9.4:1. | The draw grey is darker than `--color-fg-muted`, which reaches only 6.7:1 with white. |
  | 3 | The yellow stripe | `#9A7400`, a dark mustard, reaches 3.9:1 on its tint. The test holds each zone colour at 3:1 or more. | ⚠ The app yellow `#D9A900` looks more yellow, but reaches only 2.0:1 on the tint. To keep it, the test skips yellow. |
  | 4 | The names | `--color-zone-{green,blue,yellow,red}`, `--color-zone-{colour}-tint`, `--color-form-{win,draw,loss}`, and `--color-form-fg`. Each has its own value, so a later change does not move `--color-accent` or `--color-error`. | |
- **2026-11-09:** The user agreed the criteria and the 4 choices.
- **2026-11-09:** The user agreed that the task is Done.

## Report

- **What was built:** 12 colour tokens in `tokens.css` and `tokens.ts`: a colour and a tint for each of the four zones, three Form dot colours, and the dot letter colour. A new `graphicPairs` list in `tokens.ts` holds the 3:1 pairs.
- **Test approach:** the sync test checks each new token. The contrast test checks the body text on each tint and the letter on each dot at 7:1, and each zone colour on its tint at 3:1. A test keeps the new pairs in the lists.
- **Decisions made:** choices 1 to 4 in the `PROGRESS.md` Decisions log on 2026-11-09.
- **What is left, what is next:** no screen uses the tokens yet. Tasks 154 and 155 do. Task 155 removes `--color-row-positive` and `--color-row-caution`, and must use `--color-fg` in a zone row.
