# Task 268: the Popover primitive

**Status:** Refactor

## Goal

A `Popover` in `design-system/`: a square icon button that opens a small panel next to it, with any content. Task 229 uses it for the condition overlay of the wizard Teams step (the agreed Task 223 demo: below the icon, centred on it). It takes the placement and the close rules of `DropdownMenu`, which shows a list of items only.

## Acceptance criteria

- [x] A click on the trigger opens the panel. A second click closes it.
- [x] The panel shows below the trigger, or above it when the window has no room below, and stays inside the window, as `DropdownMenu` does.
- [x] The content can close the panel, for example after a pick.
- [x] Escape closes the panel and puts the focus back on the trigger. A click outside, a scroll, and Tab out of the panel close it.
- [x] On open, the focus goes to the first element of the panel that takes the focus.
- [x] The trigger tells a screen reader that it opens a panel, and whether the panel is open. The panel has a name.
- [x] `DropdownMenu` and `Popover` share the placement code. `DropdownMenu` works as today: its tests pass with no change.
- [x] The folder of a new primitive (`DESIGN_SYSTEM.md`), and Testing Library tests through the rendered control.
- [x] Lint, the format check, the type check, and the full suite pass.

## Notes

- **2026-11-16:** Task created by User, from Task 229 option A. Inputs: `src/design-system/components/DropdownMenu/` (`restingBox`, `placeMenu`, the close on an outside pointer, on a scroll, on Escape, on Tab), `DESIGN_SYSTEM.md` (the primitive folder, "An overlay is a native `<dialog>`"), and the agreed demo `docs/design-reference/MVP3/m3-condition-setters.html`.
- **2026-11-16:** The user agreed the criteria and six choices: (1) the props `label`, `icon`, `panelLabel`, `align` (`start`, `center`, `end`, default `center`), and `children` as a function of `close`. (2) The square icon `Button` trigger, with `aria-haspopup="dialog"` and `aria-expanded`. (3) A non-modal `role="dialog"` panel, not a native `<dialog>`. (4) `restingBox` and the placement move to `src/design-system/placement.ts`, with a centred line. (5) One line in `DESIGN_SYSTEM.md`: a popup next to its trigger is not a dialog. (6) Escape closes only the `Popover` inside a `Modal`.
- **2026-11-16:** Tests first: the new test file failed before the code. `Button` typed `aria-haspopup` as `'menu'` only, so it takes `'menu' | 'dialog'` now. `Button` gives no `title`, so the trigger has no mouse tooltip, and the choices did not ask for one. Tab inside the panel keeps it open: a focus that leaves the panel for an element outside the `Popover` closes it. A temporary Vite page with headless Chromium showed the open panel below the icon, centred on it, with the condition control, as the Task 223 demo. The page was deleted after the check.
- **2026-11-16:** The user agreed the review. Commit 1, then the refactor pass.

## Report

- **What was built:** `Popover` in `src/design-system/components/Popover/`, with its `types.ts`, CSS module, test, and `package.json`, exported from the barrel. A click on the square icon trigger opens a fixed panel, placed by `placePopup`, and the focus goes to the first element of the panel that takes it. Escape closes it and puts the focus back on the trigger, also inside a `Modal`. A click outside, a scroll, and a focus that leaves the panel close it. The content closes it with `close`. `src/design-system/placement.ts` holds `getRestingBox` and `placePopup`, moved from `DropdownMenu`, with the new `center` line. `DropdownMenu` uses them, with no change in behavior. `DESIGN_SYSTEM.md` has the popup line.
- **Test approach:** 17 Testing Library tests in `Popover.test.tsx`: the trigger, open and close by click, not modal, the focus on open, a close from the content, a click inside, Escape, a click outside, a scroll, Tab inside and out, Escape inside a `Modal`, and the placement (centred, start, end, above, the window edge). The 26 `DropdownMenu` tests pass with no change. Full suite: 2446 tests pass. Lint, the format check, and the type check pass.
- **Decisions made:** the six choices above. They are in the `PROGRESS.md` Decisions log.
- **What is left, what is next:** Task 229 uses the `Popover` for the condition overlay, and can start after this task is Done.
- **Refactor:** waits for the review.
