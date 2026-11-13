# Task 136: the bracket tree

**Status:** Done (2026-11-03)

## Goal

Give the engine the shape of a bracket phase before any tie is played: the seeds, the slots, the byes, the ties of each round with their ids, and the round names. Task 137 plays the ties on this tree, and Task 139 stores it. This task adds no screen and no stored data.

Stories: US-04.2 (the first-phase draw, the standard placement), US-04.10 (the byes and the bye change), US-04.11 (the bye tie), US-04.14 (the round names). The engine rows only.

## Acceptance criteria

### Slots and placement (US-04.2)

- [x] `bracketSlotCount(qualifiers)` gives the next power of 2: 6 qualifiers give 8 slots. Fewer than 2 qualifiers throws a `RangeError`.
- [x] `standardPlacement(slots)` gives the seed of each slot, top to bottom. Tests cover each row of this table, and 32 slots:

  | Slots | First-round ties, top to bottom |
  |---|---|
  | 2 | 1 v 2 |
  | 4 | 1 v 4, 2 v 3 |
  | 8 | 1 v 8, 4 v 5, 2 v 7, 3 v 6 |
  | 16 | 1 v 16, 8 v 9, 4 v 13, 5 v 12, 2 v 15, 7 v 10, 3 v 14, 6 v 11 |

- [x] A test for 2 to 64 slots: seeds 1 and 2 can meet only in the final, seeds 1 to 4 only from the semi-finals on, and so on.
- [x] `drawBracketSeeds(teams, rng)` gives a random seed order for a first-phase bracket. The same seed of the `Rng` gives the same draw. The input does not change.

### Byes (US-04.10, US-04.11)

- [x] The bye count is the slot count minus the qualifier count.
- [x] `defaultByeTeams(seeds)` gives the top seeds, one for each bye. For example, 6 qualifiers: seeds 1 and 2.
- [x] With the default byes, each missing seed is a bye, by the standard placement.
- [x] After a bye change, the bye teams take the bye slots in seed order. The other teams take the other slots in seed order. The seeds do not change.
- [x] Fewer bye teams than byes: the tree has no first round. The engine says so, so the screen can show "Assign 2 / 2 byes to play the first round.".
- [x] More bye teams than byes, or a bye team that is not a qualifier: a `RangeError`.

### The tree (US-04.2, US-04.11, Task 77)

- [x] `buildBracketTree(phase, seeds, byeTeams)` gives the rounds in order. Each round has its ties, top to bottom.
- [x] A tie id is `p{phase}.r{round}.t{tie}`, for example `p3.r2.t1`. The final is `p{phase}.r{last}.final`.
- [x] A first-round tie has two teams, or one team and a bye. A bye tie has a tie id and no match.
- [x] A bye team is in its next-round tie from the start, with no click (US-04.11).
- [x] A later tie takes the winners of two adjacent ties of the round before.
- [x] Each tie keeps the seed of each known team (Task 79 needs the higher seed).

### Round names (US-04.14)

- [x] `roundName(teams)` gives "Final" (2), "Semi-finals" (4), "Quarter-finals" (8), then "Round of 16", "Round of 32", and so on. Tests cover 2 to 64.
- [x] Byes count as slots: a bracket of 6 qualifiers starts with the "Quarter-finals".
- [x] A `THIRD_PLACE_NAME` constant: "Third-place playoff".
- [x] Type check, lint, Prettier, and the full test suite pass.

## Out of scope

- The third-place tie in the tree, playing ties, playable ties, the dependent clear, and the single-match final (Task 137).
- The current round for the badge and the header, and the winner line. They need results (Tasks 139, 141).
- The Seed List tags, stars, and texts (Task 142). The bracket header line (Task 141).
- Storing the draw and the bye choice (Task 139).

## Notes

- **2026-11-03:** Facts from the code. `pickQualifiers` (`src/engine/phases/phaseStart.ts`) gives the qualifiers in seed order (Task 78), so this task takes an ordered team list. `buildPhase` throws for a bracket until Task 139. `drawGroups` has its own Fisher–Yates shuffle, and `engine/round-robin/singleDuels.ts` has another. `fixtureId` is the only id builder for round-robin fixtures. No code parses an id.
- **2026-11-03:** Proposed choices, for the user to agree before the work starts:

  | # | Choice | Effect | Undo cost |
  |---|---|---|---|
  | 1 | The tree is static. A later-round slot names the tie it comes from. Task 137 fills it from the results. | One tree for each bye choice. A bye change builds a new tree. | Low |
  | 2 ⚠ | A bye team sits in its next-round tie in the tree, as a known team. A bye tie lists the team and no opponent. | US-04.11 "no click" comes from the tree. Task 137 never plays a bye tie. | Low now, high after Task 139 |
  | 3 | Fewer bye teams than byes gives a result with no tree and the counts, not a `RangeError`. | The screen can show "Assign 2 / 2 byes" without a `try`. | Low |
  | 4 | One tie id builder, `bracketTieId`, beside `fixtureId`. Task 137 adds `.third` and the match parts. | The Task 77 rule: one builder, no parse. | Low |
  | 5 ⚠ | The round names are English text in `engine/bracket`, as the board row says. | The screens and the text export (Task 148) share one function. `adapters/` cannot import `features/`. The engine has no other screen text today: the phase texts live in `features/leagues`. | Low |
  | 6 | `drawBracketSeeds` gets its own shuffle, as `drawGroups` does. A shared shuffle is a separate refactor. | No change to the group draw or to its seeded results. | Low |

- **2026-11-03:** The user agreed the criteria and choices 1 to 6.

- **2026-11-03:** The tests ran red first (no module), then green. To prove them, I broke the code in five ways: a reversed placement pair, bye teams not first, a bye team not sent on, no final id, and a wrong seed number. Each break fails at least one test.
- **2026-11-03:** A bye tie never has the bye in the first slot. The first slot of each first-round tie has a placement number of slots / 2 or less, and a bracket has more qualifiers than that.

## Report

- **What was built:** a new `engine/bracket` module.
  - `bracketSlotCount`, `standardPlacement`, `drawBracketSeeds`, `roundName`, `THIRD_PLACE_NAME`, and `bracketTieId`.
  - `defaultByeTeams` and `buildBracketTree(phase, seeds, byeTeams)`. The tree gives the rounds, each with its slot count and its ties. A slot is a known team with its seed, a bye, or the winner of a tie of the round before.
  - Too few bye teams gives `{ status: 'missing-byes', byes, assigned }`.
  - No caller uses the module yet. Task 137 is the first.
- **Test approach:** 89 new unit tests in `placement.test.ts` and `tree.test.ts`, 1483 tests in total.
  - The story placement table for 2 to 16 slots, and 32 slots.
  - For 2 to 64 slots: each seed shows once, and seeds 1 to 2^m meet only in the last m rounds.
  - The tree for 2, 3, 6, and 8 qualifiers in full, and an invariant check for 3 to 33 qualifiers.
  - The bye change: slots, seeds, and the next round.
  - The draw: each team once, deterministic, and 50 seeds give more than 40 orders.
- **Decisions made:** choices 1 to 6 above, in the `PROGRESS.md` Decisions log on 2026-11-03.
- **What is left, what is next:**
  - Task 137 adds the third-place tie and its `.third` id, the match parts of the fixture ids, and the play on this tree.
  - Task 139 stores the seed order (or the draw) and the bye teams, and builds the tree again from them.
  - `drawBracketSeeds` and `drawGroups` have the same shuffle. A shared shuffle can be a separate refactor.
