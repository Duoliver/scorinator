# Task 135: penalties, the coin toss, the four sequences, away goals

**Status:** Done (2026-11-03)

## Goal

Give the engine the full play of one bracket tie: one click gives a winner and a loser (US-04.4, US-03.2). The tie plays its match or its two legs, then away goals, AET, and the tiebreak method when the tie is level. This task also adds the penalty shootout and the coin toss models (US-03.3, Task 80). It adds no screen and no stored data.

Stories: US-03.3 (engine rows), US-03.2 (the four sequences, the replay), US-04.4 (aggregate, away goals, winner and loser).

## Acceptance criteria

### Penalties and the coin toss (US-03.3)

- [x] `scorinatePenalties(homeOvr, awayOvr, rng)` runs kick by kick. Each kick scores with p = clamp(0.75 + 0.10 × (own OVR − opponent OVR) / 100, 0.6, 0.9).
- [x] The `Rng` picks the team that kicks first, 50/50. Kicking first gives no edge.
- [x] Five kicks each, in turn. The shootout stops when one team cannot catch up. If level after five each, the teams kick in pairs until one pair has a winner.
- [x] It returns the shootout score, for example 5–4, as a `MatchScore`. The score is never level.
- [x] `tossCoin(rng)` gives home or away, 50/50. It takes no OVR.
- [x] Unit tests: the early stop (for example 3–0 after three kicks each), sudden death, the same seed gives the same shootout.
- [x] Statistical tests, 20,000 shootouts or tosses for each case, inside the Task 80 bands:

  | Test | Band |
  |---|---|
  | Penalties, gap 0: either team wins | 47% to 53% |
  | Penalties, gap 15: the stronger team wins | 52% to 59% |
  | Penalties, gap 30: the stronger team wins | 57% to 64% |
  | Penalties, gap 60: the stronger team wins | 66% to 75% |
  | Penalties, equal teams: kicks that score | 72% to 78% |
  | Coin toss: the home side wins | 47% to 53% |

### One tie (US-03.2, US-04.4)

- [x] `playTie(higherSeed, lowerSeed, rules, rng)` plays a whole tie. A team is `{ id, ovr }`, generic over the team id, as in `engine/round-robin`. `rules` holds the tie format, the away-goals rule, "Plays AET", the tiebreak method, and the league home advantage.
- [x] A single-match tie: one match `leg1`, at a neutral venue (no home boost). The team with more goals after 90 minutes wins.
- [x] A two-legged tie: `leg1` at the lower seed, `leg2` at the higher seed (Task 79). Each leg uses the league home advantage. The higher aggregate wins.
- [x] Level on aggregate, with the away-goals rule on: the team with more away goals wins, with no AET. Level away goals go on to the sequence below.
- [x] A level tie follows one of the four sequences. Each row is a test case:

  | AET | Method | Sequence |
  |---|---|---|
  | On | Penalties | AET → Penalties |
  | Off | Penalties | Penalties |
  | On | Replay → Coin toss | AET → Replay → replay AET → Coin toss |
  | Off | Replay → Coin toss | Replay → Coin toss |

- [x] AET follows the last match: the single match (neutral) or `leg2` (with its home boost). It re-uses the elasticity of that match (Task 134).
- [x] AET goals never count as away goals.
- [x] A replay is one new match, `replay`, at a neutral venue, with a new elasticity roll. There is no second replay.
- [x] Penalties use the stored OVRs, with no home boost.
- [x] The result lists each match with its part (`leg1`, `leg2`, `replay`), its home and away team ids, its 90-minute score, and its AET goals apart. It also has the shootout score or the coin toss, the winner, the loser, and how the tie was decided.
- [x] Tests cover each path: a win in 90 minutes, on aggregate, on away goals, level away goals, and each of the four sequences.
- [x] Type check, lint, Prettier, and the full test suite pass.

## Out of scope

- The bracket tree, playable ties, the round, the dependent clear, the third-place tie, and the single-match final rule (Tasks 136, 137). Task 137 passes the format "single match" and away goals off for a single-match final.
- The full fixture ids. Task 137 builds them from the tie id and the part, for example `p3.r2.t1.leg2`.
- The bracket settings in `BracketPlan` (Task 140), the tie card (Task 141), and the stored tie record (Task 139).

## Notes

- **2026-11-03:** Facts from the code. `BracketPlan` (`src/engine/phases/types.ts`) has no settings yet. Task 140 adds them. `engine/tiebreak` does not exist yet. It is in the module map (`docs/module-boundaries.md`). Task 134 gives `rollElasticity`, `scorinatePeriod`, and `scorinateExtraTime`.
- **2026-11-03:** US-04.5 says one click plays the whole tie. So `playTie` plays every step in one call, and a re-scorinate calls it again.
- **2026-11-03:** Proposed choices, for the user to agree before the work starts:

  | # | Choice | Effect | Undo cost |
  |---|---|---|---|
  | 1 | `engine/tiebreak` holds `scorinatePenalties`, `tossCoin`, and `playTie`. Task 137 calls `playTie` for each tie. | One place for the tie rules. `engine/bracket` holds the tree only. | Low |
  | 2 ⚠ | A new `TieRules` type in `engine/tiebreak`: `format` (`'singleMatch'` or `'twoLegged'`), `awayGoals`, `playsAet`, `method` (`'penalties'` or `'replayCoinToss'`), `homeAdvantage`. Task 140 puts the first four in `BracketPlan`. | These names go into the league files in Task 140. | Low now, high after Task 140 |
  | 3 ⚠ | The result keeps the AET goals apart from the 90-minute score of each match. A `decidedBy` field: `regulation`, `awayGoals`, `aet`, `penalties`, `replay`, or `coinToss`. | The tie card (141) and the text export (148) read it. Future features §22 needs no data change. | Low now, high after Task 139 |
  | 4 | In a neutral match (a single match or a replay), the higher seed takes the home slot. It gets no boost. | The tie card lists the higher seed first. | Low |
  | 5 | The shootout score uses the home and away of the last match. Who kicks first is not stored. | The card can show "Pens 5-4" in either order. Task 141 picks it. | Low |
  | 6 | 20,000 shootouts or tosses for each statistical case, from one fixed seed. The Task 80 bands, with no new numbers. | A stable test, about 1 second. | Low |

- **2026-11-03:** The user agreed the criteria and choices 1 to 6.

- **2026-11-03:** The string values use kebab-case, as `PhasePlan` does (`'round-robin'`, `'two-way'`): `'single-match'`, `'two-legged'`, `'replay-coin-toss'`, `'away-goals'`, `'coin-toss'`. Choice 2 wrote them in camelCase. The names and the meaning are the same.
- **2026-11-03:** The coin toss has no own field in the result. `decidedBy: 'coin-toss'` and the winner say all that the tie card needs.
- **2026-11-03:** The tests were written before the code, but not run red first. To prove them, I broke the code in seven ways: penalties with the home boost, a single match with the boost, a replay with the boost, no early stop, a new elasticity for the AET, swapped leg hosts, and a kick chance with no OVR gap. The first test version missed three of them, because it checked one seed only. Each test of a step now checks every seed that reaches the step, and each break fails at least one test.

## Report

- **What was built:** a new `engine/tiebreak` module.
  - `computeKickChance`, `scorinatePenalties`, and `tossCoin`, with the Task 80 constants.
  - The `TieRules`, `TieTeam`, `TieMatch`, and `TieResult` types.
  - `playTie(higherSeed, lowerSeed, rules, rng)`, which plays one whole tie: the match or the legs, the aggregate, away goals, AET, then penalties or a replay and the coin toss.
  - No caller uses the module yet. Task 137 is the first.
- **Test approach:** 56 new tests in `penalties.test.ts` and `tie.test.ts`, 1394 tests in total.
  - Penalties: a scripted `Rng` checks the early stop after a full round and in the middle of a round, the away team kicking first, and sudden death.
  - Ties: 12 rule sets × 3,000 seeds. Each tie has one winner and one loser. The decision matches the scores and the rules. Each path of the four sequences happens, plus away goals.
  - The venue, the home boost, the AET elasticity, the replay roll, and the stored OVRs for penalties: each seed that reaches the step is checked against a replay of the `Rng` draws.
  - Statistical tests, 20,000 runs for each case, seed 135. Measured values, all inside the Task 80 bands:

  | Test | Band | Measured |
  |---|---|---|
  | Penalties, gap 0 | 47% to 53% | 49.8% |
  | Penalties, gap 15 | 52% to 59% | 55.8% |
  | Penalties, gap 30 | 57% to 64% | 60.9% |
  | Penalties, gap 60 | 66% to 75% | 70.1% |
  | Kicks that score, equal teams | 72% to 78% | 75.0% |
  | Coin toss, home side wins | 47% to 53% | 50.5% |

- **Decisions made:** choices 1 to 6 above, in the `PROGRESS.md` Decisions log on 2026-11-03. The kebab-case values are in the notes.
- **What is left, what is next:**
  - Task 137 builds the fixture ids from the tie id and each match part, and passes `single-match` with away goals off for a single-match final.
  - Task 140 puts `format`, `awayGoals`, `playsAet`, and `method` in `BracketPlan`.
  - Next: Task 136 (the bracket tree). It does not depend on this task.
