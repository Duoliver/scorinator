# Task 166: a tooltip hint that follows the pointer

**Status:** Cancelled

## Goal

Give `Tooltip` an option for small triggers that sit close together, such as the colour swatches (Task 114). A hint over the trigger centre can cover the next trigger. A hint that moves with the pointer stays near the pointer, so the user sees the hint and the trigger together.

## Acceptance criteria

Proposed, not agreed. The user cancelled the task before the criteria were agreed.

- [ ] `Tooltip` takes a boolean `followPointer`, off by default, as the coding standards ask.
- [ ] With `followPointer` on, a hover places the hint above the pointer, centred on it, 12 px away. The hint moves when the pointer moves on the trigger.
- [ ] The hint goes below the pointer when the window has no room above. It stays inside the window on the left and the right.
- [ ] With `followPointer` on, the hint also acts as `notHoverable`: the pointer goes through it, and it hides at once when the pointer leaves the trigger.
- [ ] A keyboard focus places the hint from the trigger box, as now.
- [ ] The swatches of `SwatchPicker` use `followPointer`.
- [ ] New `Tooltip` tests for the place, the move, the flip, the edge, and the focus. A `SwatchPicker` test for the option.
- [ ] `npm run lint`, `npm run format:check`, `npm run type-check`, and `npm test` pass.
- [ ] The user checks the swatches in the real app.

## Notes

- **2026-11-11:** Facts from the code. `Tooltip.tsx` places the fixed hint from the trigger box when it opens (`placeHint`), with `GAP` 6 px and `EDGE` 8 px. `notHoverable` (Task 114) uses `pointer-events: none` and hides at once. Users of `notHoverable`: `SwatchPicker`, `TeamName` (Location and trigram hints, Task 157), and the Form dots (`standings/helpers.tsx`, Task 154). The tests mock `getBoundingClientRect`, so a pointer test can give `clientX` and `clientY` on a `mousemove`.
- **2026-11-11:** The user parked the idea in `docs/scorinator-future-features.md` §25, and cancelled the task for MVP2. No code changed.

## Report

- **What was built:** nothing. The task stopped at the criteria step.
- **Test approach:** none.
- **Decisions made:** the user parked the idea (future features §25) and cancelled the task for MVP2.
- **What is left, what is next:** the proposal above stays for the refinement of §25. Next is Task 178.
