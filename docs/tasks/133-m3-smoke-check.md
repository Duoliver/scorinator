# Task 133: M3 smoke check

**Status:** Done

## Goal

The user tries the app at the end of M3 (Task 84): phases, groups, and the phase transition, in the real Tauri window. As in Task 122, the check has three parts: the automated checks, one end-to-end test of the milestone, and a list of rows that the user checks in the real app.

## Acceptance criteria

The user agreed these criteria and choices 1 and 2 on 2026-11-02.

**Automated checks:**

- [x] `npm run lint`, `npm run format:check`, `npm run type-check`, `npm test`, and `npm run build` pass. Done on 2026-11-02: 1317 tests.
- [x] A new M3 end-to-end test in `src/app/smoke.test.tsx`, beside the M1 and M2 tests, with the same fake Tauri modules (choice 1):
  1. Import 6 teams from a CSV.
  2. In the wizard Phases step, set phase 1 to "Groups round robin (two-way)" with 2 groups and the top 2, and add phase 2 as "Groups round robin (two-way)" with 2 groups.
  3. In the Teams step, "Load them all" fills 2 group cards of 3. Create the league.
  4. In League Detail, scorinate every matchday of phase 1, then "Start phase 2 · Group Stage" and confirm.
  5. In phase 2, "⟲ Shuffle groups" works. Phase 1 shows the lock hint.
  6. Press Ctrl+S and start a new session. The dashboard card shows "MD 1/2". The opened league is the same as before the save, with phase 2 as the open tab.

**The user, in the real app (`npm run tauri:dev`, choice 2):** rows 1 to 7, 9, and 10 pass. Row 8 passes, except its Bracket part, which cannot occur yet (Notes).

| # | Area | Check |
|---|---|---|
| 1 | Wizard | The Phases step: formats, "+ Add phase", Top, best M with "Use best N", the counts, and the warnings. |
| 2 | Wizard | A Groups phase 1: the Teams step shows group cards. Shuffle, drag, and "Move to Group X" work. A group of 1 keeps "Create league" off. |
| 3 | Wizard | The Review step shows each phase with its full label and detail. "Create league" makes the league. |
| 4 | Dashboard | The card shows the phase text ("Group Stage → Round robin") and the progress badge. The button sits at the bottom edge. |
| 5 | Detail | The header shows the phase text, the points, and the badge "Group Stage · MD x/y". One tab for each phase. |
| 6 | Detail | Group cards wrap, with the tints: top N green, the best-M place lighter yellow. The advancement line shows. |
| 7 | Detail | Fixtures: a group tag on each match, a bye line for each group, "Scorinate matchday" plays every group. |
| 8 | Transition | A complete phase shows "Start phase 2 · …". The confirm, the new tab, and the lock of phase 1. A Bracket next phase has the button off, with its reason. |
| 9 | Transition | A later Groups phase: Shuffle, moves, and swaps until its first result. A group of 2 keeps its moves off. With 4 groups of 2, a swap rearranges the groups (Task 183). |
| 10 | Restart | Save, close, and start the app. The league, its phases, and its results are the same. |

## Choices for the user

| # | Choice | Proposal | Flag |
|---|---|---|---|
| 1 | The chain of the end-to-end test | Groups → Groups, so one test covers the wizard draw, the phase start, the lock, and the later Shuffle (Task 181). A Bracket cannot start before Task 139. | ⚠ Groups → Round robin is the more usual chain, but it does not reach the later draw. |
| 2 | The manual check | The 10 rows above. The user can skip a row or add one. | |

## Notes

- **2026-11-02:** Started. M3 holds Tasks 123 to 132, plus 174 to 177 and 181 from the reviews, and 182 from the Task 132 review. The M1 and M2 smoke tests cover no M3 feature.
- **2026-11-02:** The user agreed the criteria and choices 1 and 2.
- **2026-11-02:** The automated checks pass: lint, format check, type check, 1317 tests, and `npm run build`. The M3 end-to-end test passed on its first run. A wrong expected badge ("MD 1/3") made it fail, so the test checks the badge. The manual rows wait for the user.
- **2026-11-02:** At row 9, the user found that 4 groups of 2 in phase 2 allow no rearrange: new Task 183 (swap). Row 9 now checks the swap too.
- **2026-11-02:** The user checked the rows. Row 8: the off Start button for a Bracket next phase (Task 132 choice 4) cannot show in the real app, because the wizard keeps "Create league" off for any Bracket phase until M4 (Task 129 choice 2). Claude missed this at Task 132. The code path has its screen test, and Task 140 (wizard bracket settings) makes it reachable. The user: "that's ok".

## Report

- **What was built:** one end-to-end test, `smoke: M3 phases, groups, and the phase start`, in `src/app/smoke.test.tsx`. It drives the real screens through `AppShell`: a 6-team CSV import, the Phases step (Groups, top 2, then Groups by count), the Teams step draw (2 cards of 3), "Create league", every phase-1 matchday, "Start phase 2 · Group Stage" through the confirm, Shuffle in phase 2, the lock hint in phase 1, Ctrl+S, and a new session. In the new session, the card shows "MD 1/2" and the phase text, the opened league is equal to the league before the save, and phase 2 is the open tab.
- **Test approach:** the same fake Tauri modules as the M1 and M2 tests. A wrong expected value made the test fail. Full suite: 1317 tests. Lint, format check, type check, and `npm run build` pass. The 10 manual rows wait for the user.
- **Decisions made:** choices 1 and 2, agreed by the user. No Claude choice.
- **Manual check:** rows 1 to 7, 9, and 10 pass. Row 8 passes except its Bracket part, which waits for Task 140.
- **What is left, what is next:** the user agreed that the task is Done on 2026-11-02. M3 is complete. M4 starts with Tasks 134, 136, and 138. Task 140 makes the Bracket part of row 8 reachable.
