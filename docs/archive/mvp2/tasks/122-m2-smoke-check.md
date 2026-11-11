# Task 122: M2 smoke check

**Status:** Done

## Goal

The user tries the app at the end of M2 (Task 84): the Teams module on Blueprints, and the team selection in the league wizard, in the real Tauri window. The map asks for three things: run the app, run the end-to-end test of the milestone, and list what works.

## Acceptance criteria

The user agreed these criteria and choices 1 and 2 on 2026-10-30.

**Automated checks:**

- [x] `npm run lint`, `npm run format:check`, `npm run type-check`, `npm test`, and `npm run build` pass. Done on 2026-10-30: 977 tests.
- [x] A new M2 end-to-end test in `src/app/smoke.test.tsx`, beside the M1 test, with the same fake Tauri modules (choice 1):
  1. Import a team CSV with the Location and Trigrams columns, through the confirm.
  2. In the wizard, add the teams with the add dialog, and edit one team for this league: its OVR and a fixed trigram.
  3. Create the league, press Ctrl+S, and start a new session.
  4. The league Instances keep their names, OVR, and trigrams. The Blueprints keep their Location and trigrams.

**The user, in the real app (`npm run tauri:dev`):** all 11 rows pass (the user, 2026-10-30).

| # | Area | Check |
|---|---|---|
| 1 | Teams | The list shows the Location and Trigrams columns. An empty trigram list shows the name trigram, muted. |
| 2 | Teams | The drawer has the Location and Trigrams fields, the 24 colours with a name hint, and the `-2` slug preview for a taken name. |
| 3 | Teams | Edit a team: ↻ makes a new slug after a confirm. "Delete team" asks first, with the league count. |
| 4 | Teams | "Import teams..." asks "Import teams?" with the counts. A bad slug shows an error, with no confirm. |
| 5 | Wizard | With no team in the list: "+ Add teams", "Load them all", and "Import slug list" work. A missing slug shows in an alert. |
| 6 | Wizard | The add dialog searches and selects teams. ⇄ Switch and ✕ Remove change the list. |
| 7 | Wizard | ✎ Edit for this league: the Original state, the OVR range, a Tier change rolls the OVR, a fixed trigram, Reset to original. |
| 8 | Wizard | The trigrams change live when a team is added, removed, or edited. Two teams never get the same trigram. |
| 9 | Wizard | "Create league" makes the league. Ctrl+S saves it. |
| 10 | Restart | Close and start the app. The league and the teams are the same as before. |
| 11 | Layout | A drawer scrolls inside itself, and the page behind it does not scroll. |

## Notes

- **2026-10-30:** Task started. M2 holds Tasks 111 to 121, plus 167 to 173 from the reviews. The automated checks pass: lint, format check, type check, 977 tests, and `npm run build`. The M1 smoke test covers no M2 feature.

- **2026-10-30:** The M2 end-to-end test passes. A check with a wrong expected trigram made it fail, so the test checks the trigram. Full suite: 978 tests. Lint, format check, type check, and `npm run build` pass.
- **2026-10-30:** The user checked the 11 rows in the real app. All pass. The user agreed the task is Done.

## Choices for discussion

| # | Choice | Effect | Undo cost |
|---|---|---|---|
| ⚠ 1 | Add an M2 end-to-end test now, as the map asks. About 45 minutes. | The M2 flow gets one regression test through the real screens and the disk. The other option is to keep the M1 test only and trust the screen tests. | Low |
| 2 | The manual check uses the 11 rows above. The user can skip a row or add one. | One list for the check, and the report says which rows pass. | Low |

## Report

- **What was built:** one end-to-end test, `smoke: M2 teams and team selection`, in `src/app/smoke.test.tsx`. It drives the real screens through `AppShell`: a team CSV import with Location and Trigrams through the confirm, the wizard add dialog, an edit of one team for the league (OVR 77 and the fixed trigram `SAL`), "Create league", Ctrl+S, and a new session. In the new session, the Blueprints keep their Location and trigrams, and the opened league is equal to the league before the save.
- **Test approach:** the new test uses the same fake Tauri modules as the M1 test: an in-memory disk, and the open dialog set to the CSV path for this test only. A wrong expected trigram made it fail, then the real value passed. Full suite: 978 tests. Lint, format check, type check, and `npm run build` pass. The user ran the 11 rows in the real app on 2026-10-30, and all pass.
- **Decisions made:** choices 1 and 2, agreed by the user. No Claude choice.
- **What is left, what is next:** M2 is complete. M3 starts with Tasks 123, 124, 125, and 127, which depend only on Task 122.
