# Task 169: an `Input` slot for a side button, and the Task 172 lint fix

**Status:** Done

## Goal

Pay two items of technical debt. (1) Give `Input` an optional slot for a button at the right side of the input box, in place of the fixed `Input` line height of Task 167. (2) Fix the lint error that the Task 172 commit added, so `npm run lint` passes again.

## Acceptance criteria

**The lint fix (agreed by the user on 2026-10-30, at the Task 168 review):**

- [x] `EditTeamDrawer.test.tsx` imports `./EditTeamDrawer` in one statement: `import { EditTeamDrawer, type EditTeamDrawerProps } from './EditTeamDrawer';`.
- [x] `npm run lint` shows no `no-duplicate-imports` error.

**The `Input` slot (agreed by the user on 2026-10-30, choices 1 to 5):**

- [x] `Input` has an optional `trailing` prop. Its content shows at the right side of the input box, in a row that holds the input box only. The label stays above the row (choice 1).
- [x] The slot is a square: the row stretches it to the height of the input box, and `aspect-ratio: 1 / 1` sets its width (choice 2). The row is a grid, not a flex row (see the Notes).
- [x] A new `Button` option, `fill`, makes an icon button fill its container. It replaces `fieldHeight` (choice 3).
- [x] The slug regenerate button of the team drawer goes in the slot of the slug field. The `.slugRow` styles of `TeamForm` are removed.
- [x] The `--line-height-field` and `--field-height` tokens, the fixed `Input` line height, and the `fieldHeight` option are removed (choice 4).
- [x] The regenerate button is square and as tall as the slug field in the real app (choice 5). Checked in WebKit and Chromium with Playwright, on a page with the real CSS. The user checks the Tauri app at review.

**Code:**

- [x] Unit tests with Testing Library for `Input` (the slot shows in the row, and the label still names the input box) and for `Button` (`fill`). The `TeamForm` tests pass with the slot.
- [x] `npm run lint`, `npm run format:check`, `npm run type-check`, and `npm test` pass.

## Notes

- **2026-10-30:** Task created by User, from the Task 167 review. The detail of the slot is in the Task 167 notes (the two review entries).
- **2026-10-30:** The user put the lint fix in this task, at the Task 168 review. The error is `no-duplicate-imports` at `EditTeamDrawer.test.tsx:8`, from the Task 172 commit `cd226f6`: lines 7 and 8 import from `./EditTeamDrawer` two times, once for the value and once for the type.

- **2026-10-30:** Lint fix done: the two imports are one statement. `npm run lint` passes with no error and no warning. The 15 `EditTeamDrawer` tests pass.

- **2026-10-30:** The user agreed choices 1 to 5. Choice 5 found a problem: in a flex row, WebKit and Chromium do not set the width of a stretched item from its `aspect-ratio`. The slot was 17 px wide and 47 px tall. A grid row works in both: `grid-template-columns: minmax(0, 1fr)` with `grid-auto-flow: column`, so a row with no slot has one column and no gap. Measured with Playwright on a page with the real token, `Input`, `Button`, and `Tooltip` CSS: WebKit 47 × 47 px, Chromium 45 × 45 px, and the input box at the same height. With no slot, the input box takes the full width.

## Choices for discussion

| # | Choice | Effect | Undo cost |
|---|---|---|---|
| 1 | The prop name is `trailing`, a slot for any content. | `Input` does not know about buttons. A later field can put a unit or an icon there. | Low |
| 2 | The slot wrapper makes the square, not the button. | The square follows the input box height, with no token for the height. | Low |
| ⚠ 3 | `Button` gets `fill` (off by default): width and height 100%, and the `--font-size-xl` glyph. It replaces `fieldHeight`. | One generic option, with no link to `Input`. The icon button keeps its 1.75rem square without `fill`. | Low |
| 4 | Every `Input` goes back to the browser line height. | A field can change by about 1 pixel in height, back to its height before Task 167. | Low |
| ⚠ 5 | jsdom cannot measure a layout, so the tests check the markup only. The user checks the square in the real app, because Tauri on Linux uses WebKit. | A WebKit layout problem shows only at review. | Low |

## Report

- **What was built:**
  - The lint fix: `EditTeamDrawer.test.tsx` imports `./EditTeamDrawer` in one statement. `npm run lint` passes with no error and no warning.
  - `Input` has an optional `trailing` slot. The input box and the slot sit in a grid row below the label. The slot is a square as tall as the input box, and its content fills it.
  - `Button` has a `fill` option for an icon button: it fills its container, with the `--font-size-xl` glyph. It replaces `fieldHeight`.
  - The team drawer puts the slug regenerate button in the slot of the slug field. The button and its confirm are two components now, so the slot holds the button only.
  - Removed: the `--line-height-field` and `--field-height` tokens, the fixed `Input` line height, `fieldHeight`, and the `.slugRow` styles of `TeamForm`.
- **Test approach:** 5 new tests, with Testing Library. `Input`: the slot shows in the row with the input box and not with the label, the label names the input box only, and no slot shows with no `trailing`. `Button`: `fill` (it replaces the `fieldHeight` test). `TeamForm`: the regenerate button is in the slot of the slug field. jsdom cannot measure a layout, so a Playwright page with the real CSS measured the square in WebKit and Chromium (see the Notes). Full suite: 965 tests pass. Lint, format check, and type check pass. Not checked in the Tauri app.
- **Decisions made:** choices 1 to 5, agreed by the user. Claude choices:
  - The row is a grid, not a flex row, because a flex row gives no square in WebKit or Chromium.
  - Every `Input` gets the row, also with no slot, so the markup is the same for every field.
- **What is left, what is next:** the user checked the regenerate button in the Tauri app on 2026-10-30, and agreed the task is Done. An `Input` can be about 1 pixel different in height than before, because it uses the browser line height again. Then Task 173 (the slug check), and the M2 smoke check (Task 122).
