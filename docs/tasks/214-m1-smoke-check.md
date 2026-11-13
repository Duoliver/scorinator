# Task 214: M1 smoke check

**Status:** Refactor

## Goal

The user tries the M1 Season core in the real app, before M2 starts (Task 205). An automated smoke test runs the same flow on an in-memory disk, as each MVP2 milestone did.

## Acceptance criteria

- [x] `src/app/smoke.test.tsx` has an M1 Season case: create a Season, add teams with a name clash, edit a team, finish the Season, save, and open it again in a new session. Then delete it, save, and its file is gone.
- [x] The full suite, the type check, the lint, the format check, and the build pass.
- [x] The user runs the same flow in the real app with `npm run tauri:dev`, and reports what works.

## Notes

- **2026-11-13:** Started. Inputs: Tasks 206 to 213, 249, 250, 251. The MVP2 smoke cases in `src/app/smoke.test.tsx`, and the MVP2 M1 smoke check (`docs/archive/mvp2/tasks/110-m1-smoke-check.md`).
- **2026-11-13:** The automated case passed at its first run: a smoke test checks code that exists, so it does not fail first. It imports three teams, makes "Liga Norte" 2026-27, adds the teams (one gets "(Westbury)"), edits an OVR, finishes the Season, saves, opens it in a new session, deletes it, saves, and checks that its file and row are gone.
- **2026-11-13:** The user ran the smoke check in the real app, and agreed the review. Commit 1. Status Refactor. Refactor pass: no change. Waits for the refactor review.

## Report

- **What was built:** one smoke case in `src/app/smoke.test.tsx`, "smoke: MVP3 M1 Season core (Task 214)".
- **Test approach:** the case drives the real `AppShell` on the in-memory disk of the MVP2 smoke cases. The full suite passes: 2218 tests. The type check, the lint, the format check, and the build pass.
- **Decisions made:** none.
- **What is left:** nothing. The user ran the flow in the real app. M1 is complete, and M2 starts with Task 215, the M2 demo.
- **Refactor:** no change. The smoke case follows the helpers and the style of the MVP2 smoke cases in the same file.
