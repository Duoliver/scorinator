# Task 180: A hint with the full team name on a cut name

**Status:** Done

## Goal

Show the full team name in a hint when the pointer is on a name that the screen cuts with an ellipsis. The group cards of League Detail cut a long name (Task 131). The user asked for it at the Task 131 review.

## Acceptance criteria

Agreed with the user on 2026-11-11 (choices 1 to 6).

- [x] 1. A `design-system/` hook, `useIsCut`, tells if a text is cut, and checks again when the box changes size.
- [x] 2. `TeamName` uses it. A cut name gets the hint "Name · Location", or "Name" with no Location. A name that is not cut keeps the Location hint, or no hint.
- [x] 3. A cut name is a Tab stop. A name that is not cut, with no Location, is not a Tab stop.
- [x] 4. The standings group cards and the tie cards cut on the `TeamName` text, `data-part="name"`.
- [x] 5. The "…" shows on a cut name with a Location.
- [x] 6. Tests for the hook and `TeamName` with mocked widths. A look check in headless Chromium.
- [x] `npm run lint`, `npm run format:check`, `npm run type-check`, and `npm test` pass.
- [x] The user checks the group cards and the tie cards in the real app.

## Notes

- **2026-11-02:** Task created by User at the Task 131 review: "there could be a tooltip for when hovering an ellipsed team name which would show the full name." Today a `Tooltip` text trigger is always a Tab stop, so the piece must check for the cut before it adds the hint. Task 166 (a hint that follows the pointer) is near: one task can take both, if the user wants. About 2 to 3 hours.
- **2026-11-11:** Facts from the code. Two places cut a team name: the standings group cards (`StandingsView.module.css`, on `[data-part='full']` of `TeamName`) and the tie cards (`TieCard.module.css`, on `.name` around `TeamName`). The Teams step group rows do not cut. Since Task 157, `TeamName` has a `Tooltip` with the Location on the name, so a cut name with a Location already has a hint, with the Location only. The `Tooltip` anchor is `inline-flex`, an atomic inline box: an ellipsis does not apply to it, so a cut name with a Location can show a hard cut with no "…". To check in the look check. Task 166 is cancelled, so this task does not take it. No `ResizeObserver` in `src/` yet.
- **2026-11-11:** The user agreed choices 1 to 6. The hook takes the element, not a ref, from a `useState` ref callback: the name text becomes a new element when the hint comes or goes, and a new element needs a new check.
- **2026-11-11:** Look check: a temporary demo page in Vite, opened in the headless Chromium shell, with four names in a 9rem box. Both long names show "…", with and without a Location, so the hint wrapper no longer stops the ellipsis. The DOM of the real browser gives the four hints: "Name · Location" with a Tab stop, "Name" with a Tab stop, no hint and no Tab stop, and "Location". The demo page is deleted.
- **2026-11-11 (review):** The user asked for the team name in bold in the hint. `renderNameHint` in `TeamName/helpers.tsx` gives `<strong>` for the name, then " · Location". The trigram hint uses it too, because it has the same text. `getTrigramHint` goes. 1 new test, 1 changed.

## Report

- **What was built:** `useIsCut` in `design-system/`, with a `ResizeObserver`. `TeamName` wraps its name in a `data-part="name"` block and picks the hint with `getNameHint`. The standings group cards and the tie cards cut that block. The team name in the hint is bold, also in the trigram hint (review). `Tooltip` lets a text trigger shrink (`max-width: 100%` on the anchor, `min-width: 0` on the trigger), so the "…" shows inside a hint.
- **Test approach:** 11 new tests (1 from the review), written first and seen to fail: 4 for the hook, 6 for `TeamName`. `src/test/textWidth.ts` mocks the widths and fires the observers, because jsdom has no layout. `src/test/setup.ts` adds a `ResizeObserver` that observes nothing. 2 tests changed: the Tab stop is now the parent of the name text. Full suite: 2070 tests pass. Lint, format check, and type check pass.
- **Decisions made:** choices 1 to 6, agreed by the user. Claude choice: the hook takes an element, as the note says.
- **What is left, what is next:** the user checks the two screens in the real app. This is the last of the six tasks.
