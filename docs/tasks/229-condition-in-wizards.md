# Task 229: the condition in the wizards

**Status:** Done

## Goal

The user sets the condition level of each team when a league or a playoff is made (US-14.2, US-14.3). The wizard Teams step shows the icon of each level and opens the control in an overlay below it. The playoff dialog shows the control below each team field. A slug list import sets the levels of the teams it adds, and reports the lines with a level that is not valid (US-14.4). The look follows the agreed Task 223 demo (`m3-condition-setters.html`).

## Acceptance criteria

- [x] One shared level list (the five values, the icons, the names) and one shared condition control in `features/components/`, for Tasks 229 to 231 (Task 227 choice 5).
- [x] The wizard Teams step, standalone and in a Season, has a "Condition" column between "Tier" and the row actions. With a Groups phase 1, each group card row shows the icon too. Each row shows the icon of its level, in a square button. A new team starts at level 0.
- [x] A click on the icon opens an overlay below it with the control: "Crisis", the five icons, "Peak". A pick sets the level and closes the overlay. Escape or a click outside closes it with no change.
- [x] The levels stay in the wizard draft across a nav switch. A removed or switched team loses its level. "Create league" passes the levels to `createLeague` or `createSeasonLeague`.
- [x] A slug list import sets the levels of the teams it adds. The lines with a level that is not valid show in an alert, as the slugs that are not found do.
- [x] The playoff dialog shows the control below each team field, centred, with no end labels. "Create playoff" passes the levels to `createPlayoff`.
- [x] Testing Library tests through the screens. No test of internal markup.
- [x] Lint, the format check, the type check, and the full suite pass.

## Notes

- **2026-11-16:** Started. Inputs: US-14.1 to US-14.4, the agreed demo `docs/design-reference/MVP3/m3-condition-setters.html` (Task 223: the overlay below the icon, the playoff control centred with no end labels), Tasks 226 to 228 (the create inputs, `SegmentedControl`, the slug list levels), `leagueDraftStore.ts`, `useTeamList.ts`, `useTeamsStep.ts`, and `usePlayoffDialog.ts`.
- **2026-11-16:** The overlay is a popup next to its trigger, not a modal dialog. `design-system/` has no such primitive. `DropdownMenu` has the placement (below, or above with no room), the close on an outside click, on Escape, and on a scroll, but for a list of items only. A new primitive gets its own task (Task 205 criteria). Question for the user.
- **2026-11-16:** The user chose option A: a new Task 268 builds a `Popover` primitive in `design-system/` first, from the placement and close code of `DropdownMenu`. Task 229 waits for it. The user agreed the criteria and six choices: (1) `CONDITION_OPTIONS` and a `ConditionControl` in `features/components/ConditionControl/`, with the end labels on or off. (2) A `conditions` map in the wizard draft and team list, as `fixedTrigrams`: a remove or a switch drops the level. (3) The icon button is named "Condition of <team>: <level name>". (4) The bad level lines go in a second line of the "slugs not found" notice, for example `2 levels not valid, set to 0: line 2 "north-fc +3", line 3 "south-fc x"`. (5) In the playoff dialog, each slot keeps its level when the user picks another team. (6) The Season wizard works as the standalone one.
- **2026-11-16:** Task 268 is Done: the `Popover` is in `design-system/`. The build of this task goes on.
- **2026-11-16:** With a Groups phase 1, the Teams step shows the group cards (`GroupCards`) in place of the table. The user chose the condition icon in each card row too: `GroupCards` gets an optional condition slot that only the wizard uses. The League Detail cards stay as they are. Note: the wizard table has a "Tier" column, not "Tier · OVR" as in the demo (Task 120): the "Condition" column goes between "Tier" and the row actions.
- **2026-11-16:** Tests first: 10 new screen tests failed before the code. The JSX of the condition button went in `helpers.tsx` (`renderConditionPicker`), so `useTeamsStep` stays a `.ts` hook with no markup (the three-layer rule). The notice state is now a list of lines, `importNotice`, in place of `notFound`.
- **2026-11-16:** The user agreed the review. Commit 1, then the refactor pass.
- **2026-11-16:** Refactor pass done: three comments. The refactor review waits for the user.
- **2026-11-16:** The user agreed the refactor review: Done.

## Report

- **What was built:** `features/components/ConditionControl/`: `CONDITION_OPTIONS`, `getConditionName`, `getConditionIcon`, and `ConditionControl` (a `SegmentedControl` of the five icons, with "Crisis" and "Peak", or `hideEnds`). The wizard draft and `useTeamList` hold a `conditions` map, as `fixedTrigrams`: a remove or a switch drops the level, and "Create league" passes the map to `createLeague` or `createSeasonLeague`. The Teams step has a "Condition" column: a `ConditionPicker` (`Popover` with the control) in each row, and in each group card row through a new `renderRowEnd` slot of `GroupCards`. A slug list import adds the levels of `planSlugListImport`, and its notice shows the slugs not found and the levels not valid, one line each. The playoff dialog has a control below each team field, centred, with no end labels. Each slot keeps its level when the user picks another team, and "Create playoff" passes the levels.
- **Test approach:** Testing Library through the screens. `ConditionControl.test.tsx` (7): the levels, the names, the group, the end labels and `hideEnds`, `onChange`, `disabled`. `TeamsStep.test.tsx` (7): the column at level 0, a pick that sets the level and closes the panel, Escape, a removed team that comes back at 0, the group card icon, the slug list levels and both notice lines, one bad level in the singular. `LeagueSetupScreen.test.tsx` (2): the create passes the levels, the draft keeps them across a remount. `SeasonViewScreen.test.tsx` (1): the playoff dialog levels, with a new pick that keeps the slot level. 17 new tests. Full suite: 2463 tests pass. Lint, the format check, and the type check pass. No screenshot: the user checks the screens in the real app.
- **Decisions made:** the six choices, option A (Task 268), and the group card slot. They are in the `PROGRESS.md` Decisions log.
- **What is left, what is next:** Tasks 230 (the team modal) and 231 (the League Detail Teams tab) use `ConditionControl`.
- **Refactor:** three comments, no change in code. Each one named its callers, against the comments rule of `coding-standards.md`: `renderRowEnd` in `GroupCards/types.ts` ("the condition button of the wizard", "League Detail gives none"), `renderConditionPicker` in `helpers.tsx` ("for the table and the group cards"), and `renderCondition` in `TeamsStep/types.ts` ("the group cards show it too"). No markup or CSS change. Lint, the format check, the type check, and the full suite (2463 tests) pass.
