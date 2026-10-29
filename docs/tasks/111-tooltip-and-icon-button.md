# Task 111: Tooltip, and the icon-only Button variant

**Status:** Done

## Goal

Add the `design-system/` pieces for hints and small icon buttons. The Location hint (US-09.3), the slug regenerate button (US-09.5), and the standings hints (US-12.1 to US-12.3) use them. No screen uses them in this task.

## Acceptance criteria

The user agreed these criteria and the five choices below on 2026-10-29.

**`Tooltip`:**

- [x] It wraps its trigger, and shows its content on hover and on keyboard focus (US-09.3, US-12 "Hint").
- [x] The content is text or richer content, for example a swatch and a trigram (US-12.1).
- [x] Role `tooltip`. The trigger names it with `aria-describedby`.
- [x] A text trigger, for example a team name or a header, becomes a Tab stop. A button trigger keeps its own focus: a render function gives it the `aria-describedby`.
- [x] Escape hides it. It stays while the pointer moves from the trigger onto it (WCAG 1.4.13).
- [x] It shows above the trigger, or below when the window has no room above. It is not cut off by a scroll box, for example the standings table.
- [x] An `underline` option gives a text trigger a dotted underline and the help cursor (US-12.3).

**The icon-only Button:**

- [x] A square `icon` size, 1.75rem, as the handoff row buttons (✎, ⇄, ✕). The type asks for an `aria-label`, because the button has no visible text (US-09.5).
- [x] A `focusableWhenDisabled` option: the button stays a Tab stop and gets hover when it is disabled, with `aria-disabled`. A click does nothing. A Tooltip on it then shows, for example "The slug already matches the name." (US-09.5).

**Tests and code:**

- [x] Testing Library tests for each criterion. `Tooltip` is in the `design-system` barrel, with a `types.ts` and a `package.json`.
- [x] `npm run lint`, `npm run format:check`, `npm run type-check`, and `npm test` pass.

**Out of scope:** every screen that shows a hint or an icon button (Tasks 119, 154, 157). The icon glyphs themselves.

## Notes

- **2026-10-29:** Facts from the handoff and the code. The handoff has no tooltip design: its icon buttons use the browser `title` hint. The wizard team rows have 28px square buttons with a 2px border and the glyphs ✎, ⇄, and ✕. The app has no icon library. The standings table sits in a box that scrolls on a narrow window, so a hint positioned inside that box gets cut off.
- **2026-10-29:** Claude applied a temporary try-out to `TeamsScreen.tsx` and `features/standings/helpers.tsx`, marked "TEMPORARY (Task 111 try-out)". It is not part of the task. Claude removed it after the user check.
- **2026-10-29 (review):** The user saw a large gap between a trigger and its hint on the Teams screen. The cause: in a flex row, the wrapper stretches to the height of the tallest item, and the hint took its place from the wrapper. The hint now takes its place from the trigger, the first child of the wrapper. One new test. The user then reported that the hints work.

## Choices for discussion

| # | Choice | Effect | Undo cost |
|---|---|---|---|
| 1 | A text trigger becomes a Tab stop. A button trigger gets the link through a render function. | A keyboard user reaches each hint. A standings table gets more Tab stops (Task 154). | Medium |
| ⚠ 2 | The hint is placed on the screen from the trigger position: above, or below with no room. No arrow. | It shows over a scroll box, not cut off. | Medium |
| 3 | No delay before the hint shows. A short delay (100 ms) before it hides, so the pointer can move onto it. | Hints show at once. | Low |
| 4 | Icons are text glyphs (✎, ⇄, ✕, ↻), with no icon library. | No new dependency. The glyph depends on the system font. | Low |
| ⚠ 5 | A disabled icon button with a hint uses `aria-disabled`, by an opt-in option. | The hint of a disabled button shows on hover and on focus. Other buttons do not change. | Low |

## Report

- **What was built:** `Tooltip` (hover and focus, text or rich content, a Tab stop for a text trigger, a render function for a button trigger, `underline`, Escape, a 100 ms hide delay, a fixed place above or below, inside the window). `Button` has the `icon` size, an `aria-describedby`, and `focusableWhenDisabled`. The `Button` props are a union now: the `icon` size asks for an `aria-label`.
- **Test approach:** Testing Library tests, 20 new: 16 for `Tooltip` (hover, focus, blur, Escape, Escape inside a `Modal`, rich content, `underline`, the render function, a disabled icon button, the hide delay, the hover onto the hint, above, below, a stretched wrapper, the left edge) and 4 for `Button`. jsdom has no layout, so the place tests give each box a fixed size. Full suite: 778 tests pass. The user checked the hints in the real app with a temporary try-out. Lint, format check, type check, and `npm run build` pass.
- **Decisions made:** the five choices above, agreed by the user. Claude choices: the hint is a dark box with light text, at most 16rem wide. A scroll hides it. An Escape that hides a hint inside a `Modal` does not close the `Modal`. The `icon` button turns dark on hover, as the handoff.
- **What is left, what is next:** `Table` headers are text only, so the header hints of US-12.3 need a `Table` change in Task 154. No screen uses `Tooltip` yet.

