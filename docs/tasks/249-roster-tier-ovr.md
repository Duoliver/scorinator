# Task 249: join the Tier and the OVR in the roster demo

**Status:** Done

## Goal

The Teams tab of the Season view demo shows the Tier and the OVR in one column, in one outlined box. The Tier part has the black background. Tasks 206 and 213 use this layout.

## Acceptance criteria

- [x] The roster of `docs/design-reference/MVP3/m1-season-view.html` has one "Tier · OVR" column in place of two.
- [x] Each row shows one outlined box: the Tier on a black background, then the OVR on white.
- [x] Point 7 of `docs/design-reference/MVP3/index.html` names the new column.

## Notes

- **2026-11-13:** Task created by User, after the review of Task 206. The criteria are the words of the request. A headless browser screenshot checked the box. The first version stretched the box to the column width, so the box now aligns at the start of the cell.
- **2026-11-13:** The user agreed the review: Done.

## Report

- **What was built:** one "Tier · OVR" column in the roster demo. The box has the Tier on black and the OVR on white, with one border.
- **Test approach:** no tests, as for a demo. A screenshot checked the layout.
- **Decisions made:** the roster shows the Tier and the OVR in one box (Decisions log).
- **What is left:** Task 213 builds the box in the app. The other team lists keep their Tier badge.
- **Refactor:** no app code, no refactor step.
