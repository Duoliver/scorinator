# Task 125: the group draw: size or count, add to the smallest group, moves

**Status:** Done

## Goal

Give `engine/round-robin` the pure functions for a Groups phase draw (US-02.1, US-02.5): the group count from the size or count setting, the even group sizes, the random draw, and the changes after the draw (add, remove, switch, move). Task 130 (the wizard) and Task 126 (the phase start) call them.

## Acceptance criteria

The user agreed these criteria and choices 1 to 6 on 2026-11-01. For choice 3, the user chose the resize, not a new draw.

**Count and sizes (US-02.1):**

- [x] `groupCountFor(teamCount, setting)` gives the group count. Count mode gives the count. Size mode gives teams ÷ size, rounded up: 18 teams with size 4 give 5.
- [x] It throws a `RangeError` when the size or count is not a whole number of 2 or more.
- [x] `groupSizes(teamCount, groupCount)` gives sizes that differ by 1 at most, the first groups larger: 18 teams in 5 groups give 4, 4, 4, 3, 3.

**The draw (US-02.1):**

- [x] `drawGroups(teams, groupCount, rng)` gives the groups, with the `groupSizes` sizes. The draw is pure random: no seeds, no Tiers.
- [x] The same seed gives the same draw. A test checks that each team lands in each group about equally often over many seeds.
- [x] A Shuffle is a new call of `drawGroups`.

**Changes after the draw (US-02.1, US-02.5):**

- [x] `addToSmallestGroup(groups, team)` puts the team in the smallest group, the first one if several are equal.
- [x] `removeFromGroups(groups, team)` takes the team out of its group.
- [x] `switchInGroups(groups, oldTeam, newTeam)` puts the new team in the place of the old one.
- [x] `moveToGroup(groups, team, groupIndex)` moves a team to another group. Sizes can become uneven.
- [x] `resizeGroups(groups, groupCount, rng)` changes the group count (choice 3).
- [x] Each function leaves the other teams where they are, except `resizeGroups`. No function changes its input.
- [x] `groupLabel(index)` gives the letter of a group: 0 gives `A` (choice 6).

**Not in this task:** when the wizard calls these functions (Task 130). The draw of a later phase with its qualifiers (Tasks 126 and 128). The fit checks, such as a group with fewer than 2 teams (Task 126). The screens.

## Choices for the user

| # | Choice | Proposal | Flag |
|---|---|---|---|
| 1 | The data shape | The groups are a `TeamId[][]`. The index is the group: 0 is Group A. Each function gives new arrays. | |
| 2 | The draw method | Shuffle the teams (Fisher-Yates), then deal them in order into the `groupSizes` sizes. | |
| 3 | A count change in size mode | The specs do not cover it. Example: size 4, and a 17th team makes 5 groups. Proposal, `resizeGroups`: **more groups:** add empty groups at the end, then move a random team from a largest group to the first smallest group, until the sizes differ by 1 at most. **Fewer groups:** remove the last smallest group, and give its teams one by one to the smallest group. The rest of the draw stays. | ⚠ New rule. The other option is a new draw at each count change, which drops the moves. Agreed: the resize. |
| 4 | A side effect of choice 3 | A resize also evens out sizes that manual moves made uneven. | ⚠ Agreed. |
| 5 | Moves and errors | A moved team goes to the end of its new group. A move to its own group changes nothing. A `RangeError` for a team that is not in the groups, a team that is already in, or a bad group index. | |
| 6 | Labels after Z | `A` to `Z`, then `AA`, `AB`, and so on, as in a spreadsheet. 2 teams a group can give more than 26 groups. | ⚠ The spec says only "Group A, Group B, and so on". Agreed. |

## Notes

- **2026-11-01:** Started. Task 87 settled the size or count switch, the size as a maximum, the first groups larger, the smallest-group add, and the Switch rule. Task 120 choice 8 moved the smallest-group rule to M3. No spec covers a count change in size mode (choice 3).
- **2026-11-01:** The user agreed the criteria and choices 1 to 6, with the resize for choice 3. US-02.1 Notes now name the resize rule.
- **2026-11-01:** The user agreed that the task is Done.

## Report

- **What was built:** `engine/round-robin/groups.ts` with `groupCountFor`, `groupSizes`, `drawGroups`, `addToSmallestGroup`, `removeFromGroups`, `switchInGroups`, `moveToGroup`, `resizeGroups`, and `groupLabel`. New type `GroupSetting` in `types.ts`. All are exported from `index.ts`.
- **Test approach:** 35 new unit tests in `groups.test.ts`.
  - The count and size rules, with the US-02.1 examples (18 teams, size 4, give 4, 4, 4, 3, 3).
  - The draw: all teams placed, the same seed, and a statistical test (each team in each of 4 groups in 20% to 30% of 2,000 seeds).
  - Add, remove, switch, and move, with their `RangeError` cases and no input change.
  - The resize: 4 × 4 to 5 groups over 50 seeds (the teams that do not move stay in their group), random picks, a shrink, a large drop, uneven sizes from moves, and a size-mode league built one team at a time up to 18 teams.
  - The labels, up to `AAA`.
  - A check outside the suite: with the even-out loop off, 4 resize tests fail.
- **Decisions made:** choices 1 to 6, in the Decisions log (2026-11-01). A shrink also runs the even-out step, so choice 4 applies to both directions. US-02.1 Notes name the resize rule.
- **What is left, what is next:** no caller uses the functions yet. Task 130 (the wizard Teams step with groups) calls `resizeGroups` and then `addToSmallestGroup` on each add in size mode. Task 126 does the fit checks, such as a group with fewer than 2 teams. Next on the board: Task 126 (after 123, 124, 125) or Task 127 (the dropdown menu).
