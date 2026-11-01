# Task 112: Modal, with a focus trap, and the confirm pattern

**Status:** Done

## Goal

Add two `design-system/` primitives that later tasks need: a centered `Modal`, and a `ConfirmDialog` built on it. The Picker dialog (Task 113) uses `Modal`. The confirms of US-04.6, US-07.3, US-09.4, US-09.5, and US-10.2 use `ConfirmDialog`. No screen uses them in this task.

## Acceptance criteria

The user agreed these criteria and the five choices below on 2026-10-29.

**`Modal`:**

- [x] A native `<dialog>` with `showModal()`, as `Drawer` is: the browser gives the focus trap, Escape, and the backdrop.
- [x] The caller mounts it to open it and unmounts it to close it, as `Drawer`.
- [x] Role `dialog`, `aria-modal="true"`, and an accessible name from its title. An optional description gives `aria-describedby`.
- [x] Escape, a backdrop click, and the optional ✕ button call `onClose`.
- [x] Two sizes: `sm` (23.75rem wide, the handoff confirm) and `lg` (47.5rem wide, 80% of the window high, the handoff team picker).
- [x] The look follows the handoff: a 2px border, the hard offset shadow, centered on a dark backdrop. Sizes and colours come from tokens.
- [x] On open, focus goes to the element the caller names, or else to the first control. On close, focus goes back to the element that had it before the open.
- [x] A `Modal` opened over a `Drawer` works: Escape closes the `Modal` only.

**`ConfirmDialog`:**

- [x] A `sm` `Modal` with a title, a message, a "Cancel" button, and a confirm button with the caller's label.
- [x] The confirm button is `primary`, or `destructive` when the caller asks for it. The handoff "Clear & scorinate" is red.
- [x] Focus starts on "Cancel". Escape and a backdrop click count as "Cancel".
- [x] "Cancel" calls `onCancel`. The confirm button calls `onConfirm`.

**Tests and code:**

- [x] Testing Library tests for each criterion above. The jsdom `<dialog>` polyfill in `src/test/setup.ts` keeps a stack of open dialogs, so Escape reaches the top one only.
- [x] Both primitives are in the `design-system` barrel, with a `types.ts` and a `package.json` each (`DESIGN_SYSTEM.md`).
- [x] `npm run lint`, `npm run format:check`, `npm run type-check`, and `npm test` pass.

**Out of scope:** the Picker dialog (Task 113). Every screen that shows a confirm (Tasks 119, 132, 141, 142, 149). A focus-return change in `Drawer`.

## Notes

- **2026-10-29:** Facts from the handoff and the code. The handoff has two centered dialogs: the bracket confirm in `League Detail - Mixed` (380px wide, title "Clear later rounds?", "Cancel", a red "Clear & scorinate") and the team picker in `League Setup Wizard` (max 760px wide, 80vh, with a ✕). Both use a 2px border, a 6px hard shadow, and a dark backdrop. `Drawer` already uses the native `<dialog>`, and `src/test/setup.ts` has a jsdom polyfill for one open dialog. `Button` already has a `destructive` variant.
- **2026-10-29:** A first test mounted a `Drawer` and a `Modal` in one render, and Escape closed the `Drawer`. The child effect runs first, so the parent `Drawer` called `showModal()` last and landed on top. A real browser does the same. Real use opens the confirm from a button in an open drawer, so the test now does that. `DESIGN_SYSTEM.md` records the rule.
- **2026-10-29:** The user asked where to try the primitives. Claude applied a temporary try-out patch to `TeamsScreen.tsx` and `TeamFormDrawer.tsx`, marked "TEMPORARY (Task 112 try-out)". It is not part of the task. The user tried both primitives in the real app, also a confirm over the team drawer, and reported that they work. Claude then removed the try-out.

## Choices for discussion

| # | Choice | Effect | Undo cost |
|---|---|---|---|
| 1 | Native `<dialog>` with `showModal()`, as `Drawer` does. | The browser traps the focus, so no focus trap code. | Low |
| 2 | `ConfirmDialog` is a component that the caller mounts, not a `confirm()` call that returns a promise. | Each screen keeps an "open" state, as it does for `Drawer`. | Medium |
| ⚠ 3 | Focus starts on "Cancel" in a confirm. | Enter on open does nothing harmful. A keyboard user presses Tab once to reach the confirm button. | Low |
| 4 | Two sizes only, `sm` and `lg`. | A later dialog with another size needs a new size. | Low |
| 5 | Focus goes back to the opener on close, in `Modal` only. | `Drawer` keeps its current behavior. | Low |

## Report

- **What was built:** `Modal` (`sm` and `lg`, optional description and ✕, `initialFocus`, focus back to the opener) and `ConfirmDialog` (title, message, "Cancel" first with focus, a `primary` or `destructive` confirm button), in `design-system/components/`, with their barrel exports. The jsdom `<dialog>` polyfill keeps a stack of open dialogs. `DESIGN_SYSTEM.md` has a new section on overlays.
- **Test approach:** Testing Library tests, 17 new: 11 for `Modal` (name, description, sizes, ✕, backdrop, Escape that leaves it open, first focus, `initialFocus`, focus back to the opener, a `Modal` over a `Drawer`) and 6 for `ConfirmDialog` (texts, size, focus on "Cancel", confirm, the three cancel paths, the two tones). The user checked the look, the focus, and the cancel paths in the real app with a temporary try-out (2026-10-29). Full suite: 735 tests pass. Lint, format check, type check, and `npm run build` pass.
- **Decisions made:** the five choices above, agreed by the user. Claude choices: the backdrop is 50% dark, as the handoff confirm. `Modal` takes a `FieldHandle` as `initialFocus` too, for the Picker search field (Task 113).
- **What is left, what is next:** no screen uses the primitives yet. Task 113 (Picker dialog) builds on `Modal`. Task 119 shows the first confirms.

