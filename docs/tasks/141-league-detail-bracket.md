# Task 141: League Detail bracket

**Status:** Done (2026-11-03)

## Goal

Show and play a bracket on League Detail: the tree of tie cards, "Scorinate" on each tie, "Scorinate bracket", the confirm before a re-scorinate clears later rounds, TBD and BYE slots, and the winner line. This task also turns on "Create league" and "Start phase" for a bracket, so a user can play a full bracket league for the first time.

Stories: US-04.5 to US-04.8, US-04.11, US-04.14, and the Bracket header line of US-04.2. The screen rows only. The Seed List and the bye change are Task 142.

## Acceptance criteria

### The Bracket view

- [x] A bracket phase shows the Bracket view in place of the Standings and Fixtures sub-tabs. A one-phase bracket league shows it with no phase tabs (Task 131 choice 2).
- [x] A header line, as in the handoff: "Seeded by Group Stage final standing" or "Seeded by random draw", then the tie format, the AET and method text, and "* leg score includes AET" when AET is on.
- [x] "⚽ Scorinate bracket" at the end of the header line plays every playable tie (`scorinateBracket`). It is disabled when no tie is playable.
- [x] One column for each round, left to right, with the round name at the top (US-04.14). The third-place tie shows under the final, named "Third-place playoff".
- [x] When the phase is complete: "Winner: <team>", with the team colour, above the tree (US-04.14).
- [x] With too few bye teams: "Assign 1 / 2 byes to play the first round.", and both Scorinate buttons disabled (US-04.10).

### The tie card (US-04.8, US-04.7, US-04.11)

- [x] Two team rows, each with a swatch and the name. A slot that waits for a tie shows "TBD" with a grey swatch.
- [x] One score column for each match: one for a single match, two for two legs, and one more for a replay. A score that includes AET has an asterisk.
- [x] A two-legged tie has "Agg 3–1" in the footer.
- [x] The decision tag after the score or the aggregate: "· Pens 5-4", "· Coin toss", or "· Away goals".
- [x] The winner row is bold.
- [x] The footer holds the "Scorinate" button. It is enabled on a playable tie and on a tie with a result, and disabled on a tie with a TBD team.
- [x] A bye tie shows the team and "BYE — advances automatically", with a disabled "Scorinate" button.

### Re-scorinate (US-04.6)

- [x] A re-scorinate of a tie with a dependent result opens the confirm: title "Clear later rounds?", text "This will clear results for later rounds. Continue?", buttons "Cancel" and "Clear & scorinate".
- [x] "Cancel" changes nothing. "Clear & scorinate" calls `scorinateBracketTie`, which clears the dependent ties and plays the tie again.
- [x] A re-scorinate with no dependent result plays the tie again with no confirm.

### Turn on the bracket paths

- [x] "Create league" works for a league with a Bracket phase. The Task 140 reason text goes.
- [x] "Start phase N" works for a Bracket next phase. The Task 132 hint goes.
- [x] Type check, lint, Prettier, and the full test suite pass.
- [x] The user plays a bracket league in the real app.

## Out of scope

- The Seed List sub-tab, the seed tags, the bye stars, and the bye change confirm (Task 142).
- The bracket in the results text export (Task 148).

## Notes

- **2026-11-03:** Facts from the code.
  - League Detail builds the tabs of a phase in `LeagueDetailScreen/helpers.tsx` (`getLeagueTabs`, `getPhaseTabs`). Standings and Fixtures are their own view folders: `features/standings/`, `features/fixtures/`.
  - `BRACKET_START_HINT` turns "Start phase" off for a bracket (Task 132 choice 4). `useLeagueSetup.ts` turns "Create league" off (Task 140 choice 7).
  - Task 139 gives `bracketTreeOf`, `bracketRulesFor`, `scorinateBracketTie`, `scorinateBracket`, and `isBracketPhaseComplete`. Task 137 gives `findTieTeams`, `findPlayableTies`, `hasDependentResults`, `findBracketWinner`, and `roundName`.
  - `ConfirmDialog` (Task 112), `Tooltip` (Task 111), and the positive row tint (Task 132) exist.
- **2026-11-03:** The handoff draws the tree with absolute positions and connector lines between rounds. The round names in the handoff are "Quarterfinals" and "Semifinals". The stories use "Quarter-finals" and "Semi-finals" (Task 89 gap 6).
- **2026-11-03:** Proposed choices, for the user to agree before the work starts:

  | # | Choice | Effect | Undo cost |
  |---|---|---|---|
  | 1 | A new view folder, `features/bracket/`, with `BracketView`, as `features/standings/` and `features/fixtures/`. | One place for the bracket screen. Task 142 adds the Seed List next to it. | Low |
  | 2 ⚠ | One column for each round. The ties of a column share the height, so a later tie sits between its two source ties. No connector lines. The row scrolls sideways when it is wide. | It looks like the handoff, without the lines. Lines can come later. | Low |
  | 3 ⚠ | A tie card with more than one score column has a small header row: "L1", "L2", and "Rep" for a replay. | The user can tell a leg from a replay. The handoff has no header row. | Low |
  | 4 | The winner row is bold, with the positive tint of Task 132, as the handoff does. | The winner stands out in two ways. | Low |
  | 5 | The tie "Scorinate" button is an icon button "⚽", with the hint "Scorinate this tie", as in the handoff. Its accessible name is "Scorinate", with the two team names. | The card stays narrow (about 220px). | Low |
  | 6 | The order in "Pens 5-4" follows the team rows: the top row first. | The numbers line up with the rows. | Low |
  | 7 | The method text: "AET → Penalties", "Penalties", "AET → Replay → Coin toss", or "Replay → Coin toss". | Follows the US-03.2 sequences. | Low |
  | 8 | The tie format text: "All ties single match", or "All ties two-legged (aggregate, home & away), away goals on/off", plus "· single-match final" when it is on. | Follows the handoff header line. | Low |

- **2026-11-03:** Size: about 5 hours. If it runs long, the re-scorinate confirm can split into its own task.

- **2026-11-03:** The user agreed the criteria and choices 1 to 8.

- **2026-11-03:** `engine/bracket` now exports `rulesForTie` (it was the private `pickTieRules`). The tie card reads it for its score columns before the play, so a single-match final shows one column.
- **2026-11-03:** The Start hint (`BRACKET_START_HINT`) and `hasBracketPhase` had no other use, so they are deleted. Two old tests that checked the blocks now check the new paths.
- **2026-11-03:** Test order. The helper tests and the view tests ran red first. The League Detail and wizard tests changed after the code.
- **2026-11-03:** Look check by Claude: a temporary Vite demo of a played 6-team two-legged cup in headless Chromium, after two rounds and after the end. The cards, the "L1" and "L2" header, the asterisk, "Agg" and "Pens", the bye cards, the third-place card, and the winner line show as agreed. One finding: a single match with no tag has an empty footer next to its button. The demo is deleted.
- **2026-11-03:** The user checked the real app and agreed that the task is Done.

## Report

- **What was built:**
  - `features/bracket/BracketView/`: the view, `useBracketView`, the helpers (header line, method text, tie card model), and `TieCard`.
  - League Detail shows a "Bracket" tab for a bracket phase, also in a one-phase bracket league.
  - "Scorinate bracket", the tie "⚽" button, and the "Clear later rounds?" confirm.
  - The winner line and the missing-byes line.
  - "Create league" and "Start phase" work for a bracket.
- **Test approach:** 28 new tests, 1645 tests in total.
  - Helpers: the four method texts, the header line for each shape, and the tie card for each case (no result, two legs, AET, penalties, replay with coin toss, away goals, TBD, bye, third place).
  - View, through the real store: the columns, the bye cards, TBD, one round for each click, one tie, the winner, the confirm with Cancel and Clear, two legs, and the missing byes.
  - League Detail: a Bracket next phase starts and shows its tab. Wizard: a bracket league is created with its draw.
- **Decisions made:** choices 1 to 8 above, in the `PROGRESS.md` Decisions log on 2026-11-03.
- **What is left, what is next:**
  - The user plays a bracket league in the real app.
  - Task 142: the Seed List sub-tab and the bye change.
  - The empty footer of a plain single match: a small look point for the review.
