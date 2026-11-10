# Task 156: The position chart: the "Chart" sub-tab, SVG, the group selector

**Status:** Done

## Goal

Each round-robin and Groups phase in League Detail gets a "Chart" sub-tab. It shows the place of each team after each matchday, one line for each team in its colour (US-12.4). `getPlacesByMatchday` (Task 153) gives the data.

## Acceptance criteria

Proposed on 2026-11-10. The user agreed them on 2026-11-10.

**The tab:**

- [x] A round-robin or Groups phase has the sub-tabs "Standings", "Fixtures", and "Chart", in this order. A one-phase league has them too. A bracket has no "Chart".
- [x] With no result yet, the tab shows "The chart shows after the first result."
- [x] A Groups phase has a "Group" selector above the chart. It starts on Group A.

**The chart:**

- [x] The chart is an SVG component, with no chart library.
- [x] The x axis shows each matchday of the phase. The y axis shows the places, with 1 at the top.
- [x] A matchday with at least one result is a point on each team line. A matchday with no result has no point, and the line goes across it.
- [x] Each team has one line in its team colour. A light colour gets a dark outline (choice 3).
- [x] Each line ends with the team trigram, in mono.
- [x] A hover on a point shows a hint: the trigram, the matchday, and the place, for example "SAL · MD 4 · 2nd".
- [x] A legend under the chart has one item for each team: the swatch, the trigram, and the name.
- [x] A hover on a line or a legend item, or keyboard focus on a legend item, makes that team line thicker. The other lines fade.

**Tests:**

- [x] Integration tests through League Detail and the chart component, on real results.

**Out of scope:** the points mode (`scorinator-future-features.md` §15). A chart for a bracket. A chart in the wizard. A chart export.

## Notes

- **2026-11-10:** Facts from the code.
  - `getPlacesByMatchday(teams, fixtures, results, points, lotOf)` gives `{ matchday, places }` for each matchday with a result. A result with no fixture in the list does not count, so a group chart gets the fixtures of its group only (Task 153 choice 2).
  - `phaseTeamLists` and `leagueLotOf` in `app/state/phases.ts` give the teams of each group and the fixed lots.
  - An Instance `trigram` is `''` in a league file from before Task 121.
  - The handoff has no chart design.
  - The page background is `--color-bg`. The tab content sits on it.
- **2026-11-10:** Proposed choices, for the user to agree before the work starts:

  | # | Choice | Proposal | Flag |
  |---|---|---|---|
  | 1 | Where the chart lives | A new screen folder `features/chart/`, beside `features/fixtures/` and `features/standings/`. `features/standings/` keeps one component at its root. | |
  | 2 | The size | Changed on 2026-11-10, from the user request: a 38-matchday round robin must show in full on a 1920px screen. The chart fills the width of the tab: the matchday step is the plot width divided by the matchday count. The x positions are percentages, so the text does not scale. The place numbers and the end labels sit in HTML columns beside the SVG. A step below 1rem scrolls sideways. A place is 1.75rem tall. | League Detail is 71rem (1136px) wide at most, so the tab is about 1040px wide on any screen from about 1400px. 38 matchdays then get about 25px each. With the 1rem minimum, 38 matchdays show in full on a window from about 1070px wide. A 20-team phase gives a chart 35rem tall. |
  | 3 | A light colour | A colour gets the outline when its contrast with the page background (`#F2F2F0`) is below 3:1, the WCAG level for a graphic. In the palette, 12 of 24 colours: White, Yellow, Sand, Gold, Lime, Turquoise, Sky Blue, Light Pink, Lavender, Grey, Orange, and Coral. | ⚠ A balancing value. An option: 1.5:1 gives only White, Yellow, and Sand, the story examples. The contrast function moves from the token test to `design-system/tokens/contrast.ts`, so the chart and the test use one function. |
  | 4 | The point hint | An HTML hint box over the chart, on hover of a point. A point is not a Tab stop: 20 teams and 38 matchdays give 760 points. | ⚠ A keyboard user gets no point hint. The legend gives the team, and Standings gives the numbers. |
  | 5 | The legend | A list of buttons, one for each team, in the order of the last point. Focus or hover makes the team stand out. A click does nothing more. | |
  | 6 | A missing trigram | The line end and the hint show the team name in its place, as the Form hint does (Task 154 choice 3). | |
  | 7 | The fade | The other lines go to 25% opacity. The team line goes from 2px to 4px wide. | |
  | 8 | The place text | The hint says "1st", "2nd", "3rd", "4th". The y axis shows the numbers only. | |
- **2026-11-10:** The user agreed the new choice 2, and 3:1 for choice 3.
- **2026-11-10:** The user agreed choices 1 and 4 to 8, and the criteria.
- **2026-11-10:** Review fix: the matchday numbers showed among the team lines. Cause: an SVG `text` had a smaller font size, so its `y` in `em` was shorter. The numbers are now an HTML footer under the plot, at the same percent positions. One test checks that they are outside the SVG.
- **2026-11-10:** The user checked the real app and agreed that the task is done. Zones in the chart go to Task 190.

## Report

- **What was built:** `features/chart/PositionChart` draws one SVG line for each team, from `getPlacesByMatchday`. The x positions are percentages, so the chart fills the tab width. The place numbers and the line ends are HTML columns. A Groups phase has a "Group" selector. League Detail has a "Chart" sub-tab after "Fixtures" on each round-robin and Groups phase. `design-system/tokens/contrast.ts` now holds `getContrastRatio` and `hasLowGraphicContrast`.
- **Test approach:** 21 chart tests mount the component on real results: the empty text, the lines, the axes, the points, the hint, the legend, focus and hover, the outline, a missing trigram, the group selector, and `formatOrdinal`. 6 unit tests cover the contrast functions. 3 League Detail tests cover the tab, a scorinate, the Groups selector, and no tab on a bracket. 2023 tests pass. Type check, lint, and Prettier are clean. jsdom has no layout, so the real width and the scroll are not tested. They need the real-app check.
- **Decisions made:** the eight agreed choices, in the `PROGRESS.md` Decisions log. In the code: the place row and the SVG use the same 1.75rem, with the SVG at a font size of 1rem, so the rows line up at any zoom.
- **What is left, what is next:** none in scope.
