# Task 158: M6 smoke check: MVP2 complete

**Status:** Done

## Goal

Check that M6 works end to end: Form, the GD and header hints, the zones and their editors, the position chart with its zones, the trigrams and the Location hints, and the number fields. One new end-to-end test, and one manual check by the user in the real app. M6 and MVP2 are complete when this task is Done.

## Acceptance criteria

Proposed on 2026-11-10. The user agreed them on 2026-11-10.

**Automated checks:**

- [x] `npm run lint`, `npm run format:check`, `npm run type-check`, `npm test`, and `npm run build` pass. Done on 2026-11-10: 2053 tests.
- [x] A new M6 end-to-end test in `src/app/smoke.test.tsx`, beside the M1 to M5 tests, with the same fake Tauri modules (choice 1):
  1. Import 6 teams from a CSV with Location and Trigrams. In the wizard, make a two-way round robin, and turn on a red zone for places 5 to 6, labelled "Relegation". Create the league.
  2. Scorinate matchdays 1 and 2. Standings: each team has 2 Form dots, places 5 and 6 have the red tone, and the legend says "Relegation".
  3. The Chart tab: one line for each team, a red band, and the zone legend.
  4. "Edit zones": turn on a blue zone for place 1, labelled "Champion", and save. Standings and the chart show both zones. The header shows "Unsaved".
  5. Fixtures: each row has both trigrams.
  6. Press Ctrl+S, and start a new session. The league has both zones, and Standings shows the same tones and Form.

**The user, in the real app (`npm run tauri:dev`, choice 2):**

| # | Area | Check |
|---|---|---|
| 1 | Standings | The Form dots and their hints, the GD hint, and the header hints. |
| 2 | Zones | The wizard "Zones" section: the automatic green and yellow rows, a free zone, and a problem that blocks "Create league". |
| 3 | Zones | "Edit zones" on a current, a locked, and a not-started phase. A complete Groups phase with a best M: the best place N + 1 rows turn green. |
| 4 | Chart | A 38-matchday round robin in full on a 1920px screen, a light colour with its outline, the point hint, the legend fade, the Group selector, and the zone bands. |
| 5 | Trigrams | A narrow window: trigrams in the table and in a group card. The fixtures rows, also stacked. |
| 6 | Location | The hint on a name in the table, a group card, and a tie card. No hint with no Location. |
| 7 | Number fields | The arrow keys in Top, Group size, Best, From, and To, and their limits. |
| 8 | Restart | Close the app and start it. The zones and the trigrams are still there. |
| 9 | MVP2 | One league from start to winner: Groups, then a two-legged bracket with a third place. Save, close, start, and export the results text. |

## Notes

- **2026-11-10:** Facts from the code. `src/app/smoke.test.tsx` holds the M1 to M5 end-to-end tests, with fake Tauri modules. The M2 test already imports a CSV with the Location and Trigrams columns.
- **2026-11-10:** Proposed choices, for the user to agree before the work starts:

  | # | Choice | Proposal | Flag |
  |---|---|---|---|
  | 1 | The end-to-end test | The six steps above, on one round-robin league. The Groups and bracket zone rules have their own tests in Tasks 155 and 190. | |
  | 2 | The manual check | The 9 rows above. You checked parts of them in Tasks 154 to 191, so you can skip a row or add one. Row 9 is one full MVP2 run. | |
  | 3 | After MVP2 | This task does not change the scope line of `PROGRESS.md`: it stays "MVP1 and MVP2 only" until you approve MVP3. An archive of the MVP2 log, as for MVP1, is a separate task, if you want one. | ⚠ The next work needs a decision from you. |
- **2026-11-10:** The user agreed the criteria and choices 1 to 3.
- **2026-11-10:** The M6 end-to-end test passed on its first run, and on three runs after that.
- **2026-11-10:** The user checked the real app and agreed that the task is Done. M6 and MVP2 are complete.

## Report

- **What was built:** the M6 end-to-end test in `src/app/smoke.test.tsx`. No product code changed.
- **Test approach:** one new end-to-end test, 2053 tests in total. It drives the real screens through `AppShell`: a CSV import with Location and Trigrams, a red zone in the wizard, two scorinated matchdays, the Form dots, the zone tones and legend, the chart lines and band, "Edit zones" with a blue zone and the "Unsaved" badge, the fixtures trigrams, Ctrl+S, and a new session with the same league and zones.
- **Manual check:** the user checked the real app on 2026-11-10.
- **Decisions made:** choices 1 to 3, in the `PROGRESS.md` Decisions log on 2026-11-10.
- **What is left, what is next:** M6 and MVP2 are complete. The scope line stays MVP1 and MVP2 until the user approves MVP3 (choice 3).
