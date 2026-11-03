# Task 130: wizard Teams step with groups: group cards, Shuffle, drag, Move to group

**Status:** Done

## Goal

When phase 1 is a Groups phase, the wizard Teams step shows the teams in group cards (US-02.1, US-02.4, US-02.5): the draw happens as teams are added, the user can shuffle it, drag a team, or move it with the row menu, and "Create league" sends the draw to `createLeague` (Task 128).

## Acceptance criteria

The user agreed these criteria and choices 1 to 6 on 2026-11-01.

**The draw (US-02.1, choice 1):**

- [x] The draft keeps the phase-1 draw as lists of Blueprint UUIDs, or none when phase 1 is not Groups.
- [x] An added team goes into the smallest group, the first one if several are equal. In size mode, a new group count first resizes the draw (Task 125 choice 3). "Load them all" adds each team this way.
- [x] A removed team leaves its group. In size mode, the draw then resizes to the new count.
- [x] A Switch puts the new team in the place of the old one.
- [x] When phase 1 becomes Groups, the teams are drawn at random. A change of the group setting resizes the draw. When phase 1 stops being Groups, the draw goes.
- [x] "⟲ Shuffle groups" draws again. Moves are lost.

**The cards (US-02.4, choice 3):**

- [x] With a phase-1 draw, the team list is a set of group cards that wrap to the next line. Each card has its name in a dark band: "Group A", "Group B".
- [x] Each row: ⠿, the swatch, the name with the Location hint, and a ⋮ menu (choice 2).
- [x] Under the cards, when phase 1 is not the last: "Top 2 of each group advance to the Bracket." (choice 5).

**The moves (US-02.5, choices 2 and 4):**

- [x] The ⋮ menu (`DropdownMenu`, Task 127) has Edit, Switch, one "Move to Group X" item for each other group, and Remove.
- [x] A drag of a row onto another card moves the team there.
- [x] A move can make the sizes uneven, also a group of 1. The fit problem then shows, and "Create league" stays off (choice 6).

**The checks and the create:**

- [x] The Phases and Review steps check the fit with the real phase-1 sizes (`firstGroupSizes`).
- [x] "Create league" sends the draw as `groups`. The league phase 1 has the same groups.

**Not in this task:** the Teams step without groups (it stays the table of Task 120). Shuffle and moves of a later phase (Task 132). The layout polish of the Phases step (Task 178).

## Choices for the user

| # | Choice | Proposal | Flag |
|---|---|---|---|
| 1 | Where the draw lives | In the draft, next to the teams. Each team action (add, remove, switch, load all) also changes the draw. A change of the phase-1 plan draws, resizes, or drops it. | |
| 2 | Row content | ⠿, swatch, name with the Location hint, ⋮. No trigram and no Tier in a group row: the Edit drawer shows them. "Move to group" is flat items (Task 127 choice 2). | ⚠ The table shows the trigram and the Tier today. The handoff group row has neither. Agreed. |
| 3 | Card size | The handoff 230px card width, in a wrapping row. | |
| 4 | Drag and drop | The browser drag events. The whole card is the drop target. The ⋮ menu is the keyboard way. | |
| 5 | The advancement line | Under the cards: "Top N of each group advance to the {next short name}." With a best M: "Top 2 of each group and the best 4 of place 3 advance to the Bracket." | ⚠ New text. US-02.4 gives the first form. Agreed. |
| 6 | A group of 1 | The wizard allows the move. The fit problem "group B has 1 team" shows, and "Create league" stays off. | |

## Notes

- **2026-11-01:** Started. Facts from the code: the Teams step shows a `Table` (Task 120). `useTeamList` holds the teams. `createLeague` takes `groups` (Task 128). `phaseChecks` calls `checkPhaseFit` with no `firstGroupSizes` (Task 177). The MVP2 handoff (step 3) shows 230px group columns in a wrapping row, a dark "Group A" band, rows with ⠿, a swatch, the name, and ⋮, and "⟲ Shuffle groups" beside "+ Add teams".
- **2026-11-01:** The user agreed the criteria and choices 1 to 6.
- **2026-11-01:** Claude choices found during the build: Shuffle keeps the current group count. A group setting that is not a number keeps the draw as it is. The draft draw follows the phase-1 plan in an effect on its format and group setting only. `useTeamsStep` now gives `openEdit`, `openSwitch`, and `locationOf`, so the group rows use the same drawers as the table.
- **2026-11-01:** Look check: a temporary demo page in Vite, opened in headless Chromium, with 8 teams in 3 groups and an open row menu. The cards wrap, and the menu lists "Move to Group B" and "Move to Group C". The ⋮ button is 28px, not the handoff 22px: a point for a later polish. The demo page is deleted.
- **2026-11-01:** At review, the user saw no create for an unnamed league. Cause: the MVP1 name check shows its text in the status line at the page bottom. Not a Task 130 fault: new Task 179. The user agreed that the task is Done.

## Report

- **What was built:**
  - `LeagueSetupScreen/phaseOneGroups.ts` (new): the draw after an add, a remove, a Switch, or a plan change, and the advancement line. `usePhaseOneGroups.ts` (new): the draw state, and the team actions that also change it.
  - `steps/TeamsStep/GroupCards/` (new): the group cards, the rows, the ⋮ menu, and drag and drop. The Teams step shows them in place of the table when phase 1 is Groups, with "⟲ Shuffle groups" and the advancement line.
  - The draft keeps `groups`. "Create league" sends them. `phaseChecks` and the Phases step use the real phase-1 sizes.
- **Test approach:** 27 new tests. The tests ran red first, but one wizard test passed early: `createLeague` draws on its own. I changed it to compare the league groups with the cards.
  - `phaseOneGroups.test.ts` (14): each draw function and the advancement line.
  - `TeamsStep.test.tsx` (7): the cards, the line, Shuffle, the row menu, Edit from the menu, a drop on another card, and a drop on the same card.
  - `LeagueSetupScreen.test.tsx` (6): the smallest-group add, the create with the draw, a move with its fit problem, a plan change, the draft across a remount, and Shuffle.
- **Decisions made:** choices 1 to 6, in the Decisions log (2026-11-01), and the Claude choices in the Notes.
- **What is left, what is next:** Task 131 shows the Groups phase in League Detail. Task 132 adds the phase start, and Shuffle and moves for a later phase. Task 178 (or a new polish task) can cover the 22px ⋮ button.
