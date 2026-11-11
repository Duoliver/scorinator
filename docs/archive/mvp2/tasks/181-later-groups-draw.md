# Task 181: Later Groups phase: Shuffle and moves in League Detail, until its first result

**Status:** Done

## Goal

Let the user change the draw of a Groups phase after phase 1, from League Detail, until the phase has its first result (US-02.1, US-02.5). The state has the actions (`shuffleCurrentGroups`, `moveTeamInCurrentGroups`, Task 128). Split from Task 132 (choice 1).

## Acceptance criteria

The user agreed these criteria and choices 1 to 4 on 2026-11-02.

**When (US-02.1, US-02.5):**

- [x] The draw can change only in the current phase, when it is a Groups phase after phase 1 and has no result.
- [x] After the first result, the Standings tab shows the normal group cards (Task 131), with no Shuffle and no moves.

**The editable cards (choices 1 to 3):**

- [x] Until the first result, the Standings tab of that phase shows the wizard group cards (Task 130) in place of the standings cards: ⠿, the swatch, the name, and a ⋮ menu.
- [x] The ⋮ menu has one "Move to Group X" item for each other group. No Edit, Switch, or Remove: the team list of a league is fixed.
- [x] A drag of a row onto another card moves the team.
- [x] "⟲ Shuffle groups" draws again, with no confirm, as in the wizard. Moves are lost.
- [x] Each change makes new fixtures for the phase. The Fixtures tab shows them.
- [x] A line under the cards: "You can change the groups until the first match has a result. A group needs at least 2 teams."

**A group of 2 (choice 4):**

- [x] A team in a group of 2 has its "Move to Group X" items off.
- [x] A drop that leaves a group with 1 team does nothing.

**Not in this task:** the Location hint on the league screens (Task 157). Moves after the first result (out of scope in US-02.5).

## Choices for the user

| # | Choice | Proposal | Flag |
|---|---|---|---|
| 1 | What the Standings tab shows before the first result | The wizard group cards, in place of the standings cards. All rows are at zero then, so the table tells nothing yet. | |
| 2 | Where Shuffle goes | At the end of the Standings and Fixtures row (the `Tabs` actions slot of Task 132), where the Start button goes later. | |
| 3 | The shared component | `GroupCards` and `TeamLabel` move from `LeagueSetupScreen/steps/` to the `features/leagues/` root, as both screens use them (`FEATURES.md`). Edit, Switch, and Remove become optional, and so does the Location hint. | |
| 4 | A group of 2 | The move items of its teams are off, and a drop from it does nothing. The line under the cards gives the rule. The phase started, so a group of 1 cannot be a fit warning, as in the wizard. | ⚠ New text in the line. A disabled menu item cannot show its own reason. |

## Notes

- **2026-11-02:** Task created at the Task 132 start, with the user's OK (Task 132 choice 1).
- **2026-11-02:** Started. Facts from the code: `shuffleCurrentGroups` and `moveTeamInCurrentGroups` throw for phase 1, for a phase with a result, and for a move that leaves a group of 1. The wizard `GroupCards` has Edit, Switch, Move, and Remove items, and takes `locationOf`. `DropdownMenuItem` has `disabled`. The Location hint on league screens is Task 157 (M6).
- **2026-11-02:** The user agreed the criteria and choices 1 to 4.
- **2026-11-02:** Claude choices found during the build:
  - `canChangeCurrentGroups` in `app/state/phases.ts` holds the draw rule. The screen and the draw actions both use it, so they cannot disagree.
  - `GroupCards` gets a `keepTwoPerGroup` prop, off by default. The wizard keeps its rule: a move can leave a group of 1, and the fit problem shows.
  - `FEATURES.md` shows `GroupCards/` and `TeamLabel/` at the `features/leagues/` root.
  - A failed draw change writes its message to the status line. The screen keeps a bad move off, so it is a fault guard only.
- **2026-11-02:** Look check: a temporary demo page (deleted), opened in headless Chromium at 1100px, with a Round robin → Groups league in phase 2. The cards, "⟲ Shuffle groups" at the end of the tab row, the rule line, and a greyed "Move to Group A" for a team in a group of 2 show as planned.

- **2026-11-02 (review):** The user saw a short group card (2 teams beside 3) with no line under its last row, so the row looked twice as tall. Fix: in both group cards (the draw cards and the standings cards), every row keeps its bottom border, also the last one. The list overlaps the card border by one border width, so a card at its own height shows one line at the bottom, not two. Look check (temporary demo, deleted): both cases close the last row, and a full card shows one line.

## Report

- **What was built:**
  - League Detail: until the first result of a Groups phase after phase 1, its Standings tab shows the wizard group cards with the moves, "⟲ Shuffle groups" at the end of the tab row, and the rule line. Each change makes new fixtures.
  - `GroupCards` and `TeamLabel` moved to the `features/leagues/` root. Edit, Switch, Remove, and the Location hint are optional. A `keepTwoPerGroup` prop turns the moves of a group of 2 off.
  - `canChangeCurrentGroups` in `app/state/phases.ts`. The draw actions use it too.
- **Test approach:** 9 new tests, red first, except one.
  - `phases.test.ts` (3): the rule for a later Groups phase, after a result, and for phase 1 or a round robin.
  - `LeagueDetailScreen.test.tsx` (6): the cards with Shuffle and the line, the move-only menu with new fixtures, the off items in a group of 2, a refused drop, Shuffle, and the normal cards after the first result. The last one passed early: Task 131 already shows the normal cards.
  - The wizard tests (163) pass unchanged after the move.
- **Review change:** the last row of a group card keeps its bottom border (Notes, review entry). CSS only.
- **Decisions made:** choices 1 to 4, in the Decisions log (2026-11-02). The Claude choices are in the Notes.
- **What is left, what is next:** Task 133, the M3 smoke check. The user agreed that the task is Done on 2026-11-02. Not done: a white background for the empty area of a short group card (offered at review, no answer).
