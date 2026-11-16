# Task 223: demo of the M3 screens

**Status:** Done

## Goal

Give the user a simple demo HTML file of the new M3 screens before the M3 screen tasks start (Task 205): the League Detail "Teams" tab, the team modal, and the condition overlay of the wizard Teams step and the playoff dialog. The user reviews the layout and the content, and can ask for changes. This stops rework in Tasks 229 to 231.

## Acceptance criteria

- [x] `docs/design-reference/MVP3/` holds the M3 demo: League Detail with the "Teams" tab, and the team modal (US-14.2).
- [x] The "Teams" tab shows one row for each team: the colour, the name with the Location, the trigram, the base Tier and OVR (read only), and the condition control (US-14.1, US-14.2).
- [x] The control has the five level icons (↑ ↗ – ↘ ↓), not the numbers, with "Crisis" at the -2 end and "Peak" at the +2 end. A click changes the level at once and shows the "Unsaved" state. No screen shows the real OVR.
- [x] A click on a team name opens the team modal, from the standings and the fixtures in the demo. The modal follows the user's sketch: the colour and the name, the trigram, the base Tier and OVR, the control, "Cancel" and "Save". "Cancel" and Escape show "Operation cancelled" after a level change. *(Changed in review round 1: no X.)*
- [x] A variant shows the team modal of the Season "Teams" tab, with no control.
- [x] Demo controls show an ended league and a finished Season: the control is disabled in both places.
- [x] The "Teams" tab works on a narrow screen.
- [x] A wizard Teams step demo shows the condition column from the user's sketch: each row shows the icon of its level, and a click on the icon opens an overlay with the control (US-14.2). A demo control shows the overlay above and below the icon, because the sketch leaves the place open.
- [x] The playoff dialog demo shows the condition of each of the two teams (US-14.3).
- [x] The demo uses `demo.css`, fake data, and no real logic. No app code changes.
- [x] `index.html` lists the M3 demo and the points that need a decision from the user.

## Notes

- **2026-11-16:** Started. Inputs: US-14.1 and US-14.2, the sketches in `docs/14-condition-sketches-and-drafts/` (the team modal, the Teams tab idea), the M2 League Detail demo, and the agreed demo rules of Task 205 (layout and content, fake data, no tests). The wizard condition overlay has a sketch and got no demo in Task 205, choice 3.
- **2026-11-16:** The user asked for the wizard condition overlay in the demo too. Claude added it, and the condition of the playoff dialog (US-14.3), because Task 229 builds both.

- **2026-11-16:** The user agreed the criteria. Claude wrote two demo files and the M3 classes of `demo.css`. A jsdom run clicked each control, the modal, Cancel, Save, the demo controls, and the overlay, with no script error. Headless Chromium screenshots checked the layout at 1400 and 760 pixels wide.
- **2026-11-16:** Review, round 1. The user agreed points 1 to 11, with two changes. (1) The team modal has no X, and the trigram moves into the team box, at the end side. (2) The playoff dialog shows the control below each team field, always open, with no "Crisis" and "Peak" labels, in place of the icon and its overlay. Claude changed the demos and `index.html`, and US-14.2 and US-14.3. The place of the wizard overlay (point 11, below or above) waits for the user.
- **2026-11-16:** Review, round 2. The wizard overlay opens below the icon. The playoff control is centred under its team field. The team modal is agreed. Claude changed the demo, `index.html`, US-14.2, and US-14.3. The demo controls no longer switch the overlay place.
- **2026-11-16:** The user agreed the review: Done.

## Report

**Delivered:** two demo files in `docs/design-reference/MVP3/`, and 12 review points in `index.html`.

- `m3-league-detail.html`: League Detail with the "Teams" tab, team names that open the team modal from the standings, the fixtures, and the tab, the "Unsaved" badge, "Operation cancelled", the complete league, the finished Season, and the modal of the Season "Teams" tab with no control.
- `m3-condition-setters.html`: the wizard Teams step with the condition column and its overlay (below or above), and the playoff dialog with the condition of each team.
- `demo.css` gets the M3 classes: the Tier and OVR box, the condition control, the icon and its overlay, and the team name button.

**Test approach:** no tests, as Task 205 agreed for a demo. jsdom ran the page scripts and the clicks. Headless Chromium took screenshots of six states. The open overlay has no screenshot, because the screenshot tool cannot click. jsdom checked its place class instead.

**Claude choices to review:** the 12 points in `index.html`, M3 section. The user agreed them after two review rounds, with changes to points 6, 7, 11, and 12.

**Refactor:** no app code. The demo files skip the refactor step.
