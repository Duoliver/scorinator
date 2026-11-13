# Task 110: M1 smoke check

**Status:** Done

## Goal

The user tries the app at the end of M1 (Task 84): the database at start, the teams on the Blueprints, and the leagues in the database, in the real Tauri window.

## Acceptance criteria

- [x] `npm run tauri:dev` starts the app, and the app opens the database folder.
- [x] Create two teams, create a league with them, scorinate, and press Ctrl+S.
- [x] Close the app and start it again. The league card shows on the dashboard.
- [x] Open the league. The standings are the same as before the close.
- [x] The database folder holds `manifest.json` and one `wrapper-<uuid>.json`.

## Notes

- **2026-10-29:** The user ran the smoke check in the real app, and reported that it works. The automated smoke test (`src/app/smoke.test.tsx`) runs the same flow on an in-memory disk.

## Report

- **What was built:** nothing. This task is a check by the user.
- **Test approach:** a manual check in the real Tauri app, by the user, on 2026-10-29. Before it: 718 automated tests, lint, format check, type check, and `npm run build` pass (Task 162).
- **Decisions made:** none.
- **What is left, what is next:** M1 is complete. M2 starts with Tasks 111 to 118, which depend only on Task 110.
