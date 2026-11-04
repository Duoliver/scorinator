# Task 143: M4 smoke check

**Status:** Done

## Goal

Check that M4 works end to end: the tiebreak engine, the bracket tree and play, the bracket state and files, the wizard settings, League Detail with the Bracket and Seed List tabs, and the Task 185 group rule. One new end-to-end test, and one manual check by the user in the real app. M4 is complete when this task is Done.

## Acceptance criteria

**Automated checks:**

- [x] `npm run lint`, `npm run format:check`, `npm run type-check`, `npm test`, and `npm run build` pass. Done on 2026-11-03: 1688 tests.
- [x] A new M4 end-to-end test in `src/app/smoke.test.tsx`, beside the M1 to M3 tests, with the same fake Tauri modules (choice 1):
  1. Import 8 teams from a CSV.
  2. In the wizard Phases step, set phase 1 to Groups with 2 groups and the top 2. Add phase 2 as Bracket, set "Two-legged" and "Third-place playoff".
  3. Create the league. In League Detail, scorinate every matchday of phase 1, then "Start phase 2 · Bracket" and confirm.
  4. In the Bracket tab, no first-round tie has two teams of one group (Task 185). Click "⚽ Scorinate bracket" until "Winner: …" shows.
  5. The Seed List shows the tags "A1", "B1", "A2", and "B2".
  6. Press Ctrl+S and start a new session. The dashboard card shows "Complete". The opened league is the same as before the save, with the same winner.

**The user, in the real app (`npm run tauri:dev`, choice 2):**

| # | Area | Check |
|---|---|---|
| 1 | Wizard | A Bracket card: the settings, the two-leg switches, the third place below 4 qualifiers, and the power-of-2 warning. The Review text. |
| 2 | Wizard | A one-phase cup of 6 teams: "Create league" works. |
| 3 | Detail | The Bracket tab: the header line, the round columns, the bye cards, TBD, and "Scorinate bracket" one round at a time. |
| 4 | Detail | The tie cards: "L1", "L2", "Rep", the AET asterisk, "Agg", "Pens", "Coin toss", "Away goals", the bold winner row. |
| 5 | Detail | A re-scorinate with later results opens "Clear later rounds?". Cancel and Clear both work. |
| 6 | Detail | The Seed List: the tags, the stars, the count, and "Clear bracket results?" after the first result. |
| 7 | Transition | Groups → Bracket: "Start phase 2 · Bracket", and no same-group tie in the first round. |
| 8 | Dashboard | The card badge shows the round name, for example "Quarter-finals", then "Complete". |
| 9 | Restart | Save, close, and start the app. The bracket, its results, its byes, and its winner are the same. |

## Notes

- **2026-11-03:** Facts from the code. `src/app/smoke.test.tsx` holds the M1, M2, and M3 end-to-end tests (Tasks 110, 122, 133), with fake Tauri file and dialog modules. M3 row 8 of Task 133 waited for the Bracket part: "Start phase 2 · Bracket" now works (Task 141), so manual row 7 covers it.
- **2026-11-03:** Proposed choices, for the user to agree before the work starts:

  | # | Choice | Proposal | Flag |
  |---|---|---|---|
  | 1 | The chain of the end-to-end test | Groups → Bracket, two legs and a third place, so one test covers the phase start, the group rule, the tie cards with two legs, the Seed List tags, and the save. | ⚠ A random draw decides the scores, so the test checks the shape (columns, tags, a winner), not exact scores. |
  | 2 | The manual check | The 9 rows above. You can skip a row or add one. | |

- **2026-11-03:** The user agreed the criteria and choices 1 and 2.

- **2026-11-03:** The M4 end-to-end test passed on its first run, and on three runs after that, each with new random scores. It covers the six steps of the criteria. The League Detail header shows "Bracket · Semi-finals" after the start.
- **2026-11-04:** The user checked the real app and agreed that the task is Done. M4 is complete.

## Report

- **What was built:** the M4 end-to-end test in `src/app/smoke.test.tsx`. No product code changed.
- **Test approach:** one new end-to-end test, 1688 tests in total. It drives the real screens through `AppShell`: the CSV import, the wizard with a Groups phase and a two-legged Bracket with a third place, the group play, the phase start, the Task 185 rule on the semi-finals, two "Scorinate bracket" clicks to the winner, the Seed List tags, Ctrl+S, and a new session with the same league and winner. The scores are random, so it checks the shape (choice 1).
- **Decisions made:** choices 1 and 2 above, in the `PROGRESS.md` Decisions log on 2026-11-03.
- **What is left, what is next:**
  - The user runs the 9 manual rows in the real app.
  - After that, M4 is complete. Next: M5, from Task 144 (import decisions). Task 144 has an open question on the `persistence/` import rule.
