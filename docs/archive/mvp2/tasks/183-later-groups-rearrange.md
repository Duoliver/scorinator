# Task 183: Later Groups phase: rearrange groups of 2

**Status:** Done

## Goal

Let the user rearrange the draw of a later Groups phase when every group has 2 teams, for example 8 teams in 4 groups of 2. Today the Task 181 rule turns every move off, because each move leaves a group of 1. The user found it at the Task 133 check (row 9).

## Acceptance criteria

The user picked option 1 (swap) on 2026-11-02. The user agreed these criteria on 2026-11-02.

- [x] A new engine function swaps two teams of two different groups, with unit tests (`engine/round-robin`, beside `moveToGroup`).
- [x] A new state action swaps two teams in the current later Groups phase, with the same rule as a move: no result yet. It makes new fixtures.
- [x] League Detail, draw cards: a drop of a team onto a team row of another group swaps the two teams. A drop onto the card, not on a row, stays a move, with the Task 181 group-of-2 rule.
- [x] The ⋮ menu gets one "Swap with {team}" item for each team of the other groups, after the "Move to Group X" items. The swap items stay on in a group of 2.
- [x] The wizard does not change: it gives no swap handler, so its menu and its drops stay as they are.
- [x] With 8 teams in 4 groups of 2, the user can rearrange the groups.

## Notes

- **2026-11-02:** Task created by User at the Task 133 check: "With eight teams in four groups of two, I can't reorder the teams when I set the group size. It could throw a warning when the teams arent quantitatively distributed right. [...] I'd like the group rearranging possible in this case now." The user named phase 2.
- **2026-11-02:** Two options, proposed:
  1. **Swap.** A drop of a team onto a team row of another group swaps the two teams. The ⋮ menu gets one "Swap with {team}" item for each team of the other groups. The group sizes never change, so no group of 1 can occur. About 2 hours.
  2. **Free moves with a warning.** A move can leave a group of 1. A warning names the group, and Scorinate and the phase start stay off until each group has 2 teams or more. The state must store a draw with no fixtures while a group has 1 team, and the progress and the "phase complete" rules must treat that phase as not playable. About 4 hours. A later setting (warning or error) fits this option.
- **2026-11-02:** The user picked option 1. The settings idea went to `scorinator-future-features.md` §16.
- **2026-11-02:** The user agreed the criteria. Started.
- **2026-11-02:** Claude choices found during the build: `swapInGroups` throws a `RangeError` for two teams of one group. A swap item uses the plain team name, with no group letter. A drop onto a row stops there, so the card does not take it as a move too.
- **2026-11-02:** Look check: a temporary demo page (deleted), headless Chromium at 1200px, 8 teams in 4 groups of 2 (set by size 2). The menu shows 3 greyed "Move to Group X" items and 6 "Swap with {team}" items. Point for the review: a big draw gives a long menu (16 teams in 4 groups give 12 swap items).

## Report

- **What was built:** `swapInGroups` in `engine/round-robin`, the state action `swapTeamsInCurrentGroups`, and the swap in the League Detail draw cards: "Swap with {team}" menu items and a drop onto a team row. `GroupCards` takes an optional `onSwap`, so the wizard does not change.
- **Test approach:** 7 new tests, red first, and 1 changed.
  - `groups.test.ts` (3): the swap keeps the sizes, the `RangeError` cases, and no change of the input.
  - `leagueWrapperActions.test.ts` (2): a swap with a group of 2 and new fixtures, and the `RangeError` after a result.
  - `LeagueDetailScreen.test.tsx` (2 new, 1 changed): the menu swap in 4 groups of 2 with the moves off, and the drop onto a row. The menu list test now has the swap items.
  - Full suite: 1324 tests. Lint, format check, and type check pass.
- **Decisions made:** option 1 (swap), in the Decisions log (2026-11-02). The Claude choices are in the Notes.
- **What is left, what is next:** the user agreed that the task is Done on 2026-11-02, and asked to map a better swap menu later (`scorinator-future-features.md`). Then Task 133 row 9 can pass with its new check.
