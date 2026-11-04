# Task 137: bracket play

**Status:** Done (2026-11-03)

## Goal

Play the ties of a bracket on the Task 136 tree, with the Task 135 `playTie`. The engine finds the playable ties, plays one tie or every playable tie, clears the later ties of a re-scorinated tie, and adds the third-place tie and the single-match final. Task 139 stores the results and calls these functions. This task adds no screen.

Stories: US-04.1 (the tie format on each tie), US-04.5 (one tie, or the current round), US-04.7 (the clear), US-04.12 (the third-place tie), US-04.13 (the single-match final). The engine rows only.

## Acceptance criteria

### The tree additions

- [x] `buildBracketTree` takes an optional `thirdPlace` flag, off by default. With it on, the last round has a third-place tie, id `p{phase}.r{last}.third`. Its two slots take the losers of the two semi-finals.
- [x] A new slot kind, `loser-of`, for the third-place tie.
- [x] `bracketMatchId(tieId, part)` builds a match id: `p3.r2.t1.leg2` (Task 77). It is the only builder, and no code parses it.

### Playable ties (US-04.5, US-04.7)

- [x] `findTieTeams(tree, results, tieId)` gives each slot as a known team with its seed, a bye, or TBD. A `winner-of` or `loser-of` slot is TBD until that tie has a result.
- [x] A tie winner keeps its first-round seed in later rounds (US-04.1, Task 79).
- [x] A tie is playable when both teams are known, it is not a bye tie, and it has no result.
- [x] `findPlayableTies(tree, results)` gives the playable ties in tree order.

### Play (US-04.1, US-04.5, US-04.13)

- [x] `playBracketTie(tree, results, tieId, rules, ovrOf, rng)` plays one tie with `playTie`. The higher seed is the higher seed of the two known teams. It gives the new results list.
- [x] A re-scorinate of a tie with a result clears its dependent ties first, then replaces its result (US-04.6 "Clear & scorinate").
- [x] A bye tie or a tie with a TBD team throws a `RangeError`.
- [x] `playBracketRound(tree, results, rules, ovrOf, rng)` plays every playable tie, in tree order, and only those. A tie that becomes playable from the click waits for the next call.
- [x] The tie format applies to every tie. With the single-match final on, the final and the third-place tie are one match, `leg1`, neutral, with no away goals.

### The clear (US-04.6, US-04.7)

- [x] `findDependentTies(tree, tieId)` gives every later tie that takes a team from the tie, as its winner or its loser, and their own dependents.
- [x] `hasDependentResults(tree, results, tieId)` says if a dependent tie has a result, so the screen knows when to open the confirm.
- [x] A clear removes the whole result of each dependent tie: the legs, the AET, the replay, the penalties, and the coin toss. The other ties keep their results.
- [x] Tests cover a clear from the first round, from a semi-final, and from a tie next to a bye. A re-scorinate of the first quarter-final clears its semi-final, the final, and the third-place tie, not the other semi-final.

### Completion (US-04.12, US-04.14)

- [x] `findCurrentRound(tree, results)` gives the earliest round with a tie that has no result, or nothing when the phase is complete.
- [x] The phase is complete when the final, and the third-place tie when there is one, have a result. `findBracketWinner` gives the final winner then.
- [x] Type check, lint, Prettier, and the full test suite pass.

## Out of scope

- Storing the results, the seeds, the draw, and the byes. The bye change clears every bracket result (Task 139).
- The toggles in the wizard (Task 140), the tie cards, TBD, and the confirm modal (Tasks 141, 142).

## Notes

- **2026-11-03:** Facts from the code. `playTie` (Task 135) plays one whole tie from two `{ id, ovr }` teams and a `TieRules`. `buildBracketTree` (Task 136) gives `team`, `bye`, and `winner-of` slots. A bye team is already in its next-round tie. Round-robin results are a list, each with its `fixtureId`, and `findPhaseResult` looks one up by id.
- **2026-11-03:** Found a gap in US-04.12. The story turns the third-place toggle off below 4 slots. But 3 qualifiers give 4 slots, and one semi-final is then a bye tie with no loser. See choice 3.
- **2026-11-03:** Proposed choices, for the user to agree before the work starts:

  | # | Choice | Effect | Undo cost |
  |---|---|---|---|
  | 1 ⚠ | The results are a list of `{ tieId, ...TieResult }`, as the round-robin results carry a `fixtureId`. A match id comes from `bracketMatchId(tieId, part)`. | Task 139 stores this list. | Low now, high after Task 139 |
  | 2 | In the last round, the third-place tie comes before the final. So one "Scorinate bracket" click plays it first, as in real football (US-04.12 note). Task 141 shows the final first. | The third-place tie takes the first `Rng` draws. | Low |
  | 3 ⚠ | A third-place tie needs 4 qualifiers or more. With 3 qualifiers, the tree has none, even with the flag on. Edit US-04.12 row 2 from "fewer than 4 slots" to "fewer than 4 qualifiers". | One story edit. Task 140 turns the toggle off below 4 qualifiers. | Low |
  | 4 | A `BracketRules` type: the Task 135 `TieRules` plus `singleMatchFinal` and `thirdPlace`. Task 140 stores it in `BracketPlan`, without `homeAdvantage`. | One type for the phase settings. | Low now, high after Task 140 |
  | 5 | One `playBracketTie` for a first play and a re-scorinate. It clears the dependents, then replaces the result. | The screen calls one function after the confirm. | Low |
  | 6 | `findCurrentRound` and `findBracketWinner` come here, as pure engine functions, not in Task 139. | A small scope add. Tasks 139 and 141 call them. | Low |
  | 7 | The OVRs come from an `ovrOf(teamId)` callback, as the league Instances hold them. | The engine needs no league type. | Low |

- **2026-11-03:** The user agreed the criteria and choices 1 to 7. US-04.12 row 2 now says "fewer than 4 qualifiers".

- **2026-11-03:** The tests ran red first, then green. To prove them, I broke the code in seven ways: no single-match final, the lower seed as the higher seed, direct dependents only, the winner in place of the loser for the third-place tie, a bye tie that holds the current round back, a third-place tie with 3 qualifiers, and one call that plays every round. Each break fails at least one test.
- **2026-11-03:** Each `BracketTie` now has a `kind`: `regular`, `final`, or `third`. The single-match final reads it, so no code parses a tie id. The final is tie 1 of the last round, and the third-place tie is tie 2, but the third-place tie comes first in the list.

## Report

- **What was built:** in `engine/bracket`:
  - `buildBracketTree` takes a `thirdPlace` flag, with a new `loser-of` slot and a tie `kind`.
  - `bracketMatchId`, and the `.third` tie id.
  - `findTieTeams`, `findPlayableTies`, `playBracketTie`, and `playBracketRound`.
  - `findDependentTies` and `hasDependentResults`.
  - `findCurrentRound`, `isBracketComplete`, and `findBracketWinner`.
  - The `BracketRules`, `BracketTieResult`, and `TieSide` types.
  - No caller uses the functions yet. Task 139 is the first.
- **Test approach:** 42 new unit tests in `play.test.ts`, `tree.test.ts`, and `placement.test.ts`, 1525 tests in total.
  - Hand-made results control who wins, for the TBD sides, the seeds, the playable ties, the clear, and the completion.
  - `playBracketTie` equals `playTie` with the right teams, OVRs, and rules, for a semi-final and a single-match final.
  - `playBracketRound` equals one `playBracketTie` after the other, in tree order, and plays a full bracket in three calls.
  - The clear from the first round, from a semi-final, and from a tie next to a bye.
- **Decisions made:** choices 1 to 7 above, in the `PROGRESS.md` Decisions log on 2026-11-03. US-04.12 row 2 now says "fewer than 4 qualifiers".
- **What is left, what is next:**
  - Task 139 stores the results list, calls these functions from the league actions, and clears every result on a bye change.
  - Task 140 stores `BracketRules` in `BracketPlan`, without `homeAdvantage`, and turns the third-place toggle off below 4 qualifiers.
  - Next: Task 138 (the segmented control) or Task 139 (bracket state). Task 139 needs 137 only.
