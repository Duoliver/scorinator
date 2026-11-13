# Task 206: demo of the M1 screens

**Status:** Done

## Goal

Give the user a simple demo HTML file of each new M1 screen, before the screen tasks start (Task 205). The user reviews the layout and the content, and can ask for changes. This stops rework in Tasks 212 and 213.

## Acceptance criteria

- [x] `docs/design-reference/MVP3/` holds one HTML file for each M1 screen: the Seasons list, and the Season view.
- [x] The Seasons list demo shows the Seasons menu, the search, "+ New Season", the Season cards, the create and rename dialog with the name and year error, the delete confirm, the empty list, and a search with no result.
- [x] The Season view demo shows the header, the league cards, the Teams, Playoffs, and Resume tabs, the roster with name clashes, the add teams dialog, the Season team edit drawer, and the finished state (read only).
- [x] The Playoffs and Resume tabs show a placeholder only. Their demo is Task 215 (M2).
- [x] The demos use the CSS variables of `design-system/tokens` and the app fonts, so they look like the app. They open from the file, with no server.
- [x] A demo has fake data, and no real logic or tests. No app code changes.
- [x] An index page lists the demos and the points that need a decision from the user.

## Notes

- **2026-11-13:** Started. Stories: US-13.1 to 13.4, US-13.9, US-16.5. Models in the app: the leagues dashboard (cards), League Detail (header, tabs), the Teams screen (table), the wizard Teams step (`PickerDialog`, the Edit drawer).
- **2026-11-13:** Claude wrote the demos and checked them in a headless browser, with a screenshot of each page and dialog. One fix: an element with `hidden` and a `display` class stayed visible, so `demo.css` hides `[hidden]` with `!important`.
- **2026-11-13:** The user agreed the demo and the 10 review points, with no change. Tasks 212 and 213 build the screens as the demo shows them. Done.

## Report

**Delivered:** four files in `docs/design-reference/MVP3/`.

- `index.html`: the links to the demos, and 10 points to review.
- `m1-seasons-list.html`: the Seasons menu, the search, the Season cards with a ⋮ menu, the create and rename dialog with the name and year error, the delete confirm, the empty list, and a search with no result.
- `m1-season-view.html`: the header, the league cards, the three tabs, the roster with name clashes, the add dialog, the edit drawer, the finish confirm, and the finished state. The Playoffs and Resume tabs are placeholders for Task 215.
- `demo.css`: the app fonts and tokens, copied from `design-system/tokens`, and the demo classes that copy the look of the primitives.

**Test approach:** no tests, as Task 205 agreed for a demo. A headless browser opened each page and each dialog. The screenshots showed the layout as planned.

**Claude choices to review:** the 10 points in `index.html`.

**What is left:** the M2 demo (Task 215) shows the Playoffs and Resume tabs.

**Refactor:** no app code. The demo files skip the refactor step.
