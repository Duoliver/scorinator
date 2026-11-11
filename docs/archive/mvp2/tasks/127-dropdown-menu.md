# Task 127: dropdown menu

**Status:** Done

## Goal

Add a `DropdownMenu` primitive to `design-system/`: a button that opens a short list of actions. Task 130 uses it for the team row menu (⋮: Edit, Switch, Remove, Move to group, US-02.5). Task 150 uses it for the League Detail export menu (US-10.1).

## Acceptance criteria

The user agreed these criteria and choices 1 to 6 on 2026-11-01.

**Use and look (choices 1, 2, 6):**

- [x] `DropdownMenu({ label, icon?, items, align? })` in `design-system/components/DropdownMenu/`, with `types.ts`, a `.module.css`, tests, and a `package.json`, as the other primitives.
- [x] With `icon`, the trigger is a square icon `Button` (for example `⋮`), and `label` is its `aria-label`. Without `icon`, the trigger is a text `Button` with `label` and `▾`.
- [x] Each item has a label, an optional icon, an optional `danger` tone, and an optional `disabled` flag. A `danger` item shows in the error colour.
- [x] The panel follows the handoff: surface background, the border token, the small shadow offset, a divider between items. Sizes come from tokens (`DESIGN_SYSTEM.md`).
- [x] The barrel `design-system/index.ts` exports the component and its types.

**Behaviour (choices 3, 4):**

- [x] A click on the trigger opens and closes the menu. A click on an item calls its `onSelect` and closes the menu.
- [x] A click outside the menu closes it. A scroll closes it.
- [x] The trigger has `aria-haspopup="menu"` and `aria-expanded`. The panel has `role="menu"`, and each item has `role="menuitem"`.
- [x] Keyboard: Enter, Space, or Arrow Down opens the menu on the first item. Arrow Up opens it on the last item. Arrow Up and Arrow Down move and wrap. Home and End go to the first and last item. A disabled item gets no focus.
- [x] Escape closes the menu and puts the focus back on the trigger. A select does the same. Tab closes the menu.
- [x] A disabled item does nothing on a click.

**Not in this task:** the team row menu (Task 130) and the export menu (Task 150). A submenu.

## Choices for the user

| # | Choice | Proposal | Flag |
|---|---|---|---|
| 1 | The trigger | The trigger is the `Button` primitive. `icon` gives the square icon button with `label` as its `aria-label`. Without `icon`, a `secondary` `sm` text button: `label ▾`. | |
| 2 | Flat items, no submenu | Task 130 shows "Move to group" as one item for each other group, for example "Move to Group B" and "Move to Group C". | ⚠ US-02.5 says "Move to group, with a list of the other groups". This makes the list flat. Agreed. |
| 3 | The placement | `position: fixed`, from the trigger box, as `Tooltip` does. Below the trigger, on its end edge (the handoff `right: 0`). Above it when the window has no room below. So a scroll box does not cut it off. | |
| 4 | The keyboard | The WAI-ARIA menu button pattern, as in the criteria. | |
| 5 | A `Button` change | `Button` gets two pass-through props: `aria-haspopup` and `aria-expanded`. A wrapper `span` finds the button for the focus and the position, as `Tooltip` does. | ⚠ A small change to an existing primitive. Agreed. |
| 6 | Checks in jsdom and in the app | jsdom has no layout, so the tests check the roles, the keyboard, and the clicks. The placement is checked in the real app at review. No screen uses the menu yet, so the check needs a temporary use. | ⚠ The review needs a short app check. Agreed. |

## Notes

- **2026-11-01:** Started. The MVP2 handoff (`League Setup Wizard`) has the team row menu: a 22px ⋮ button, and a panel with `top: 26px; right: 0`, a 2px border, a 3px shadow, a 150px minimum width, and items with a 16px icon column (✎ Edit, ⇄ Switch, ✕ Remove in the error colour). The handoff has no export menu (US-10.1 notes). `Tooltip` is `position: fixed` from the trigger box and hides on a scroll (Task 111).
- **2026-11-01:** The user agreed the criteria and choices 1 to 6.
- **2026-11-01:** Preact runs `useEffect` after the paint, so a fast key sequence missed an item. The focus moves in `useLayoutEffect`.
- **2026-11-01:** Placement check (choice 6), done by Claude: a temporary demo page in Vite, opened in headless Chromium with Playwright, in four places. Results: below the trigger with the end edges equal and a 4px gap. Clamped to 8px at the left window edge. Above the trigger near the window bottom. Not cut off by a 60px scroll box. The screenshots showed one flaw: an item with no icon started left of the labels with icons. Fixed: one icon in the menu gives every item the icon column. The demo page is deleted.
- **2026-11-01:** At review, the user asked for the demo page back, to test it in a browser. TEMPORARY files: `zz-dropdown-demo.html` and `src/zzDropdownDemo.tsx`. Delete both before the commit.
- **2026-11-01 (review):** The user asked to line up the menu with the button, not with its shadow. Two causes: the 8px window margin moved a menu right of a button 3px from the edge, and `Button` moves 1px on hover, so the menu measured the moved box. Fix: the menu keeps the trigger edge, and moves in by 8px only when it would go out of the window. It measures the trigger box without its CSS move (`restingBox`). 2 new tests. In Chromium, with the pointer off the button, the edges are equal.
- **2026-11-01:** The user agreed that the task is Done. The demo page files are deleted.

## Report

- **What was built:** `design-system/components/DropdownMenu/` (`DropdownMenu.tsx`, `types.ts`, `.module.css`, `package.json`, tests), exported from the barrel. `Button` passes `aria-haspopup` and `aria-expanded` through.
- **Test approach:** 25 new tests in `DropdownMenu.test.tsx` and 2 in `Button.test.tsx`. The tests ran red first.
  - The trigger (icon and text), the roles, `aria-expanded`.
  - The mouse: open, close, select, a disabled item, a click outside, a scroll, the danger tone, the icon column.
  - The keyboard: Arrow Down, Enter, Space, Arrow Up, the arrows with a skip and a wrap, Home, End, Enter to select, Escape, Tab, and Escape inside a `Modal`.
  - The placement, with mocked boxes: below on the end edge, the start edge, above, the left clamp, the trigger edge near the window edge, and the trigger without its hover move.
  - A real-browser check outside the suite (see Notes). It ran in headless Chromium, not in the Tauri webview.
- **Decisions made:** choices 1 to 6, in the Decisions log (2026-11-01). Claude choices: the trigger is the `secondary` variant. One icon gives every item the icon column. A click opens the menu on the first item, as the keyboard does.
- **What is left, what is next:** no screen uses the menu yet. Task 130 adds the team row menu, and Task 150 the export menu. A submenu is out of scope (choice 2).
