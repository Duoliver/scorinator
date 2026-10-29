# Task 163: rename the `blueprint*` files to `teamBlueprint*`

**Status:** Done

## Goal

Use one name for one thing. The type is `TeamBlueprint`, so the action file and its names say "team Blueprint" too. A reader then sees at once that a Blueprint is a team.

## Acceptance criteria

- [x] `src/app/state/blueprintActions.ts` and its test become `teamBlueprintActions.ts` and `teamBlueprintActions.test.ts`, with `git mv`.
- [x] The names inside change: `addTeamBlueprint`, `updateTeamBlueprint`, `importTeamBlueprints`, `TeamBlueprintInput`, `TeamBlueprintChanges`.
- [x] Every import, call, and code comment in `src/` uses the new names.
- [x] No behavior changes. Old task files and old log entries keep the old names, because they are history.
- [x] `npm run lint`, `npm run format:check`, `npm run type-check`, and `npm test` pass.

## Notes

- **2026-10-29:** The user chose option B: the files and the names inside. Five files import the action file. The user also asked about `instanceActions`: none is planned, because an Instance change is a league change, in `leagueWrapperActions.ts`.

## Report

- **What was built:** `teamBlueprintActions.ts` and its test, renamed with `git mv`. The five names inside are renamed in 10 files in `src/`.
- **Test approach:** no new tests, because the behavior is the same. Full suite: 845 tests pass. Lint, format check, and type check pass.
- **Decisions made:** option B, by the user. Old task files and log entries keep the old names.
- **What is left, what is next:** nothing. Next is Task 161.
