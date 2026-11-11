# Task 190: Zones in the position chart

**Status:** Done

## Goal

The position chart shows the zones of its phase (US-12.5) behind the team lines, so the user sees when a team enters or leaves a zone. The user asked for it at the Task 156 review.

## Acceptance criteria

Proposed on 2026-11-10. The user agreed them on 2026-11-10.

- [x] Each zone of the phase gets a band behind the team lines, across the plot, over its place rows, in the zone tint.
- [x] The place numbers of a zone get the zone tint and the zone stripe on the left, as a table row does.
- [x] A Groups phase uses the same zones for each group, by place.
- [x] The zone legend of Standings also shows under the chart.
- [x] A change in "Edit zones" shows in the chart at once.
- [x] Integration tests through the chart component.

**Out of scope:** a zone change by matchday. A zone mark on a team line.

## Notes

- **2026-11-10:** Facts from the code.
  - `getPhaseZones(plan)` gives the zones by place. `getPhaseZoneView` gives the row colours, with the complete-phase rule of US-07.2.
  - The chart box has the `--color-surface` background. The zone tints are light, near the surface value, so the 3:1 outline rule of Task 156 still fits.
- **2026-11-10:** Proposed choices, for the user to agree before the work starts:

  | # | Choice | Proposal | Flag |
  |---|---|---|---|
  | 1 | The zones to show | The zones by place, from `getPhaseZones`, also in a complete phase. The chart shows places, not teams, so the automatic yellow band stays on place N + 1. | ⚠ The table of a complete phase has no yellow row (US-07.2). The chart keeps the yellow band. |
  | 2 | The legend | The same legend as Standings: the colour, and the label or the places. It shows each zone that covers a place of the chart. | The Standings legend hides a zone with no row (Task 155 choice B). The chart uses places, so a yellow zone of a complete phase still shows. |
  | 3 | The shared code | The zone legend moves from `features/standings/` to `features/components/ZoneLegend/`, so the two screens use one component. | A move of existing code. |
- **2026-11-10:** The user agreed the criteria and the three choices.
- **2026-11-10:** The user checked the real app and agreed that the task is done.

## Report

- **What was built:** the chart draws a band in the zone tint for each zone of its phase, behind the grid and the lines. The place numbers of a zone get the tint and the stripe of a table row. A zone that starts below the last place is left out, and a zone past the last place stops at it. The zone legend moved to `features/components/ZoneLegend/`. Standings and the chart both use it.
- **Test approach:** 6 chart tests mount the component on real results: the bands and their order behind the lines, the place tones, the legend, a zone below or past the last place, no zones, and the yellow band of a complete Groups phase. 1 League Detail test saves a zone in "Edit zones" and finds its band in the chart. The Standings legend tests guard the move. 2030 tests pass. Type check, lint, and Prettier are clean. Not checked yet: the look in the real app.
- **Decisions made:** choices 1 to 3, in the `PROGRESS.md` Decisions log.
- **What is left, what is next:** none in scope.
