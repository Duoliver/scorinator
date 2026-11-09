# Task 147: The final ranking across phases

**Status:** Done

## Goal

One pure function gives the final ranking of a league, from its current results (US-10.5). A team that reached a later phase comes first. Inside a phase, the phase order decides. Task 148 writes the slug list from it, and Task 150 adds the menu item.

## Acceptance criteria

The user agreed the criteria on 2026-11-04.

- [x] `engine/phases` has one pure function that takes one order input for each started phase and gives the ranking. It is generic over the team id.
- [x] The teams of a later phase come first. A team that went out in an earlier phase follows, in the order of that phase.
- [x] Round robin: the table order (Task 78).
- [x] Groups: place 1 of each group, then place 2, and so on. Inside one place: the Task 78 cross-group order (`orderAcrossGroups`).
- [x] Bracket: the round reached, later first. In the last round, the final comes before the third-place tie. Inside the final or the third-place tie: the winner, then the loser, when it has a result. Inside one round: the seed.
- [x] It works at any time, with the current results: an unplayed tie or matchday leaves the teams in seed or table order.
- [x] An app function gives the ranking of a `LeagueWrapper` as Blueprint UUIDs, from the stored phases, the standings, and the bracket tree.
- [x] Tests for a one-phase league, Groups → Bracket, and two round-robin phases (US-10.5). Tests for the bracket rules: the third place, a bye team, and a round with no result.

**Out of scope:** the slug list text (Task 148). The menu item (Task 150). A ranking table on screen (US-10.5).

## Notes

- **2026-11-04:** Facts from the code.
  - `app/state/phases.ts` `phaseStandings` gives the tables of a round-robin or Groups phase, with the lots. `app/state/bracket.ts` `bracketTreeOf` gives the tree of a bracket phase.
  - `engine/standings` `orderAcrossGroups` orders rows from many groups (Task 78 rule 3).
  - `engine/bracket` `findTieTeams` gives each side of a tie with its first-round seed. The final is tie 1 of the last round, the third-place tie is tie 2.
  - A bracket that waits for its byes has no tree (`missing-byes`).
- **2026-11-04:** Proposed choices, for the user to agree before the work starts:

  | # | Choice | Proposal | Flag |
  |---|---|---|---|
  | 1 | The shape | `engine/phases` takes the tables and the tree as inputs, so it stays pure. `app/state` builds the inputs from the league. | |
  | 2 | A bye team before any play | It reached round 2, so it comes before the first-round teams. | ⚠ A team with a bye that the user starred (US-04.10) can rank above a better seed before the first round is played. |
  | 3 | A bracket that waits for its byes | No tree, so its teams come in seed order. | |
  | 4 | The scope | The engine function and the app function. No text, no menu. | |
- **2026-11-04:** The user agreed the criteria and the 4 choices.

- **2026-11-04:** The tree lists the third-place tie before the final in its tie array (Task 137 choice 2). The ranking reads the tie kind, not the array order, so the final still ranks first.
- **2026-11-04:** The user agreed that the task is Done.

## Report

- **What was built:** `engine/phases/finalRanking.ts`: `finalRanking` takes one `PhaseOrderInput` for each started phase and gives the ranking, generic over the team id. `app/state/finalRanking.ts`: `leagueFinalRanking` builds the inputs from a league (the tables with the lots, and the bracket tree) and gives Blueprint UUIDs.
- **Test approach:** 10 unit tests for the engine: a one-phase round robin, a Groups phase with the cross-group order, two round-robin phases, Groups → Bracket, and five bracket cases (no result, a third place, no third place, an unplayed final, a bye team, a bracket that waits for its byes). 3 integration tests on the real store: a round robin, Groups → Bracket with random scores (run six times), and a league with only phase 1 started. 1783 tests pass.
- **Decisions made:** choices 1 to 4 in the `PROGRESS.md` Decisions log on 2026-11-04.
- **What is left, what is next:** Task 148 writes the slug list from `leagueFinalRanking`, with the Instance slugs. Nothing on screen uses it yet.
