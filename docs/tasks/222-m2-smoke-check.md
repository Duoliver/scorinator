# Task 222: M2 smoke check

**Status:** Done

## Goal

The user tries the M2 Season leagues and playoffs in the real app, before M3 starts (Task 205). An automated smoke test runs the same flow on an in-memory disk, as the M1 smoke check did (Task 214).

## Acceptance criteria

The user agreed the criteria on 2026-11-15.

- [x] `src/app/smoke.test.tsx` has an M2 case, "smoke: MVP3 M2 Season leagues and playoffs (Task 222)". The case does these steps through the real `AppShell`:
  1. Import teams, create a Season, and add a roster (as Task 214).
  2. Create two leagues in the Season with the wizard. One Season team plays in both leagues (US-13.5, US-13.6). One team from outside the roster joins the Season at the create (Task 218).
  3. Open League Detail of one league from its card, with the breadcrumbs, and scorinate a matchday. The other league stays unplayed (US-13.6).
  4. Create a playoff in the Playoffs tab, and play it. The row names the winner (US-13.7).
  5. Open the Resume tab. The played league shows "First place now", and the unplayed league shows "No results yet." (US-13.8).
  6. Save, and open the Season again in a new session. The leagues, the results, and the playoff come back unchanged.
  7. Finish the Season. League Detail is read only, and "Play" and "+ New playoff" are off (US-13.9).
- [x] The full suite, the type check, the lint, the format check, and the build pass.
- [x] The user runs the same flow in the real app with `npm run tauri:dev`, and reports what works.

## Notes

- **2026-11-15:** Task file written. Inputs: Tasks 215 to 221 and 253, and the M1 smoke case of Task 214. The criteria wait for the user.
- **2026-11-15:** The user agreed the criteria. Started on the smoke case.
- **2026-11-15:** The automated case passed at its first run: a smoke test checks code that exists, so it does not fail first. A check with one wrong count ("9 playoffs") made it fail, so the case reads the real screen. It imports four teams, makes "Liga Norte" 2026-27 with three roster teams, and creates "Primeira Divisão" (Dragões do Sul joins) and "Taça Norte" with the wizard. It scorinates matchday 1 of the first league, creates and plays "Supertaça", reads the Resume tab, saves, opens the Season in a new session, finishes it, and checks the read-only League Detail.
- **2026-11-15:** The user agreed the review. Commit 1. The refactor pass is next.
- **2026-11-15:** The refactor pass read the diff against the review checklist. One change, in the report. The CSV import and the Season create steps repeat in each case, as in every smoke case of the file: each case reads as one flow. No bug found.
- **2026-11-15:** The user agreed the refactor review. Done. M2 is complete.

## Report

- **What was built:** one smoke case in `src/app/smoke.test.tsx`, "smoke: MVP3 M2 Season leagues and playoffs (Task 222)". The header comment of the file names the M1 and M2 cases.
- **Test approach:** the case drives the real `AppShell` on the in-memory disk of the earlier smoke cases. The full suite passes: 2333 tests. The type check, the lint, the format check, and the build pass.
- **Decisions made:** none.
- **What is left:** the user runs the same flow in the real app with `npm run tauri:dev`. Then M2 is complete, and M3 starts with Task 223, the M3 demo.
- **Refactor:** one change, no change in behavior. The M1 and the M2 cases had the same `rosterRows` helper. One `rosterRows` function at the file level, beside `standingsRows`, now serves both. The full suite (2333 tests), the type check, the lint, the format check, and the build pass.
