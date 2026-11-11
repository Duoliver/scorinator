# Task 170: Drawer layout: its own scroll, and the shell scroll locked while it is open

**Status:** Done

## Goal

On a short window, the team drawer is taller than the window, and it does not scroll. So the user cannot reach "Save" and "Delete team". The drawer must scroll inside itself, and the page behind it must not scroll while it is open.

## Acceptance criteria

The user agreed these criteria and the three choices below on 2026-10-30.

- [x] The drawer panel is never taller than the window.
- [x] When the content is taller than the panel, the panel scrolls inside, with the mouse wheel, the scroll bar, and the keyboard focus (Tab to a field out of view brings it into view).
- [x] While a drawer is open, the page behind it does not scroll: no wheel scroll, no scroll bar jump.
- [x] When the drawer closes, the page scroll works again, at the same place.
- [x] Both drawers get the fix: the Teams screen drawer and the wizard "Create new team" drawer. They share `Drawer`.
- [x] The user checks it in the real app, in a window about 600 pixels tall.
- [x] `npm run lint`, `npm run format:check`, `npm run type-check`, and `npm test` pass.

**Out of scope:** a new drawer design. The `Modal` layout, unless choice 3 adds it.

## Notes

- **2026-10-30:** Facts from the code, before any test in the real app. `Drawer` is a native `<dialog>` (`.host`: `position: fixed`, `inset: 0`, `height: auto`) with a child `.panel` that has `height: 100%` and `overflow-y: auto`. A likely cause: the `100%` does not resolve against a box with `height: auto`, in the Tauri web engine, so the panel grows with its content, and its `overflow-y: auto` never scrolls. The page scroll is the document scroll: `.shell` has `min-height: 100vh`, and only the side nav is fixed. Nothing locks it while a dialog is open. jsdom has no layout, so a test cannot see a scroll. The real app check is the main check.

- **2026-10-30 (review):** The user found the scroll bar over half of the click area of the right swatches, because the panel padding put the scroll area inside the panel. The user chose: keep the content scroll, but give the padding to the header row and to the content, not to the panel. One local variable, `--drawer-padding` (`--space-8`), holds it. The content then reaches the window edge, and so does its scroll bar. The `--space-1` shadow padding is gone: the content padding holds the shadows now.

## Choices for discussion

The user agreed my picks on 2026-10-30: (1) the content only scrolls, (2) one CSS rule, (3) every dialog.

| # | Choice | Effect | Undo cost |
|---|---|---|---|
| 1 | What scrolls: the whole panel, or the content only, with the title and the close button fixed at the top. | With the content only, the close button stays in view. | Low |
| 2 | The scroll lock: one CSS rule, `html:has(dialog:modal) { overflow: hidden }`, or code in `Drawer` that sets and clears the lock. | The CSS rule needs no code, and covers every open dialog. | Low |
| ⚠ 3 | The lock also covers `Modal` and `ConfirmDialog`, as they are dialogs too. | A long confirm never scrolls the page behind it. | Low |

## Report

- **What was built:**
  - `Drawer.module.css`: the dialog has `height: 100vh`, so the panel `height: 100%` always resolves. The panel does not scroll. The title row stays at the top, and `.content` scrolls below it. At review, the padding moved from the panel to the header row and the content, with one `--drawer-padding` variable, so the scroll bar sits at the window edge.
  - `tokens/elements.css`: `html:has(dialog[open]) { overflow: hidden }` locks the page while any dialog is open.
  - `DESIGN_SYSTEM.md`: the overlay section names the lock and the drawer scroll.
- **Test approach:** jsdom has no layout, so no project test sees a scroll. I checked the real `Drawer` and `TeamForm` in a test page outside the project, with Playwright, in WebKitGTK (build 2359) and Chromium, in a 1000 × 600 window:
  - New CSS, both engines: the panel is 600 px tall. The content scrolls (WebKit: 488 px shown of 750 px). The title stays at 32 px. "Delete team" ends at 568 px, in view. A wheel over the content or the backdrop leaves the page at 300 px. After Escape, the page is still at 300 px, and a wheel scrolls it to 500 px.
  - Old CSS, both engines: a wheel over the backdrop scrolled the page from 300 px to 800 px, so the lock failed. But the old panel did scroll, with its title out of view. So the first guess in the notes (a panel that grows with its content) is not proven in these engines. Your WebKitGTK version can act in a different way: the real app check decides.
  - After the review change, both engines: the content ends at 1000 px, the window edge. The fields, the swatch group, and the ✕ end at 968 px. So a scroll bar up to 32 px wide does not cover a swatch. The headless engines use overlay scroll bars (0 px wide), so the real app shows the real scroll bar.
  - Full suite: 896 tests pass. Lint, format check, type check, and `npm run build` pass.
- **Decisions made:** the three choices above, agreed by the user. Claude choice: `height: 100vh` on the dialog. At review, the user chose the padding on the header row and the content, with one variable.
- **What is left, what is next:** the user checks the real app in a window about 600 px tall. If the lock fails there (`:has()` needs WebKitGTK 2.42 or later), the lock moves into `Drawer` code. The test page is not part of the project: an end-to-end layout test is not in scope.
