# Task 080: settle open decision 6, the AET and penalty models

**Status:** Done (2026-10-27)

## Goal

Decide how the engine simulates extra time (AET) and a penalty shootout, and the statistical test band for each (`src/engine/ENGINE.md`). Task 88 (Tiebreak Configuration) builds on these models. The coin toss is already settled as a pure 50/50.

## Acceptance criteria

- [x] The user picks the AET model and its test bands.
- [x] The user picks the penalty model, its OVR weight, and its test bands.
- [x] The user picks whether home advantage applies in AET and in penalties.
- [x] The `PROGRESS.md` Decisions log has an entry for the choices.
- [x] The `PROGRESS.md` Open questions list no longer has decision 6.
- [x] The report below records the choices and their effect on Task 88.

## Notes

- **2026-10-27:** Facts from the code. `scorinateMatch` (`src/engine/scorination/scorination.ts`) rolls one elasticity value (0.4 to 1.6), then draws a Poisson score for each team from `computeExpectedGoals`. It models a full 90-minute match only. `playMatch` applies the home boost when the league has it on.
- **2026-10-27:** Measurements, from a scratch copy of the engine formula, 400,000 runs for each case. Only regulation draws go to AET. AET expected goals = full-match expected goals × 1/3.

  | Case | AET with the same elasticity: drawn, mean goals | AET with a new elasticity: drawn, mean goals |
  |---|---|---|
  | OVR 65 v 65 | 54.4%, 0.80 | 52.0%, 0.87 |
  | OVR 35 v 35 | 56.6%, 0.73 | 54.5%, 0.79 |
  | OVR 95 v 95 | 52.2%, 0.87 | 49.9%, 0.95 |
  | OVR 80 v 65 | 53.4%, 0.82, stronger wins 65.0% of decided | 51.1%, 0.89, stronger wins 65.1% of decided |

  For context: regulation draws at OVR 65 v 65 are 28.3%.
- **2026-10-27:** Penalty measurements, 200,000 shootouts for each case. Kick-by-kick model: each kick scores with p = clamp(0.75 + w × (own OVR − opponent OVR) / 100, 0.6, 0.9). Five kicks each, then sudden death. Win rate of the stronger team:

  | Weight w | Gap 0 | Gap 15 | Gap 30 | Gap 60 |
  |---|---|---|---|---|
  | 0.10 | 50.0% | 55.3% | 60.4% | 70.6% |
  | 0.15 | 49.9% | 58.0% | 65.5% | 79.4% |
  | 0.20 | 50.0% | 60.6% | 70.5% | 86.5% |
  | 0.25 | 50.0% | 63.1% | 75.2% | 92.2% |

  Real football: about 75% of kicks score, and a shootout is close to a coin toss, with a small edge to the favourite.
- **2026-10-27:** The user agreed the criteria. The user chose "1/3 xG, same elasticity", "Kick by kick, w = 0.10", and "AET yes, penalties no".

## Report

- **What was built:** no code. Decision 6 is settled.
  1. **AET model:** the extra 30 minutes use expected goals = full-match `computeExpectedGoals` × 1/3. AET re-uses the elasticity of the match, because it is the same match.
  2. **Penalty model:** kick by kick. Each kick scores with p = clamp(0.75 + 0.10 × (own OVR − opponent OVR) / 100, 0.6, 0.9). The teams take five kicks each, in turn. The shootout stops when one team cannot catch up. If still level, sudden death in pairs. The engine returns the shootout score, for example 4–3, for the tie card.
  3. **Home advantage:** AET in a second leg keeps the home boost, because it continues at the same stadium. Penalties use the stored OVRs, with no boost. Single matches and replays stay neutral (Task 74).
- **Test bands (statistical, over many seeded runs, per `ENGINE.md`):**

  | Test | Band |
  |---|---|
  | AET after a drawn match stays drawn, equal teams at OVR 35, 65, and 95 | 48% to 60% |
  | Mean AET goals, equal teams at OVR 35, 65, and 95 | 0.65 to 0.95 |
  | OVR 80 v 65: the stronger team wins a decided AET | 60% to 70% |
  | Penalties, gap 0: either team wins | 47% to 53% |
  | Penalties, gap 15: the stronger team wins | 52% to 59% |
  | Penalties, gap 30: the stronger team wins | 57% to 64% |
  | Penalties, gap 60: the stronger team wins | 66% to 75% |
  | Penalties, equal teams: kicks that score | 72% to 78% |
  | Coin toss, gap 60: the stronger team wins (Task 74) | 47% to 53% |

- **Test approach:** none, no code changed. The bands come from the measurements in Notes.
- **Decisions made:** logged in the `PROGRESS.md` Decisions log on 2026-10-27.
- **Effect on other tasks:**
  - **Task 88 (Tiebreak Configuration):** the refined stories use these models and bands. Two proposed defaults, for the user to confirm in Task 88: an `Rng` 50/50 picks the team that kicks first, and kicking first gives no edge.
  - **Engine:** `engine/tiebreak` holds the shootout and the coin toss. AET needs a `scorinateMatch` variant that takes the elasticity and a time share, so the match and its AET share one roll.
- **What is left, what is next:** next is decision 7 (Task 81).
