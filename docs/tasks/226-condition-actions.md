# Task 226: the condition actions

**Status:** Done

## Goal

The store sets the condition level of a team in a league, locks it after the league ends, and plays every match with the real OVR (US-14.1 to US-14.3). The create actions take the levels of the wizard and of the playoff dialog. No screen uses the actions yet: Tasks 229 to 231 add the controls.

## Acceptance criteria

- [x] An action sets the level of one team in an open league, standalone or in a Season. Each league of a Season keeps its own level for the same team (US-14.2).
- [x] The action throws, and changes nothing, after the league ends, in a finished Season, for a team that is not in the league, and for a level that is not -2 to 2.
- [x] The same level again changes nothing. A change stamps the league, as the other league actions do.
- [x] Each league match uses the real OVR: a fixture, a matchday, a re-scorinate, and a bracket tie. A played match keeps its score (US-14.2).
- [x] A playoff plays with the real OVR of its own levels (US-14.3).
- [x] `createLeague`, `createSeasonLeague`, and `createPlayoff` take the levels of the wizard or the dialog, and check them.
- [x] Read helpers for the screens: the level of a team, and whether the league can still change its levels.
- [x] Unit tests for the helpers and the actions. A test with a fixed random value shows that a match uses the real OVR.
- [x] Lint, the format check, the type check, and the full suite pass.

## Notes

- **2026-11-16:** Started. Inputs: US-14.1 to US-14.3, Tasks 224 and 225, `src/app/state/leagueWrapperActions.ts` (`requireLeague`, `storeLeague`, `setPhaseZones`), `bracket.ts` (`leagueOvrOf`), `summarizeLeague.ts` (the "completed" progress), `newLeague.ts`, `seasonLeagueActions.ts`, and `seasonPlayoffActions.ts`.
- **2026-11-16:** `leagueOvrOf` in `bracket.ts` gives the OVR to every league match: `playFixture` (fixture, matchday, re-scorinate) and the two bracket actions. `playPlayoff` reads the OVR of its two teams in one place. A change in those two places covers every match.
- **2026-11-16:** The user agreed the criteria and six choices: (1) `setTeamCondition` in `leagueWrapperActions.ts`, the read helpers in a new `app/state/condition.ts`. (2) The names `setTeamCondition`, `getTeamCondition`, and `isLeagueComplete`. (3) `leagueOvrOf` keeps its name and gives the real OVR. (4) Level 0 removes the entry, and the same level changes nothing. (5) `CreateLeagueInput` and `PlayoffInput` take an optional `conditions` map. (6) No action changes a playoff level after the create.
- **2026-11-16:** Tests first: the two new test files failed before the code (no `condition.ts`, no `setTeamCondition`). `isLeagueComplete` went in `summarizeLeague.ts`, beside the private `progressOf` that it reads, not in `condition.ts`. `condition.ts` also has four helpers that the agreed names need: `getRealOvr` (the OVR of one team, for `leagueOvrOf` and `playPlayoff`), `checkConditionLevel`, `pickConditions` (the create inputs), and `replaceTeamCondition` (a copy with one new level).
- **2026-11-16:** The user agreed the review. Commit 1, then the refactor pass.
- **2026-11-16:** Refactor pass done: two changes. The refactor review waits for the user.
- **2026-11-16:** The user agreed the refactor review: Done.

## Report

- **What was built:** `setTeamCondition(ref, blueprintUuid, level)` sets the level of one team in a standalone or Season league, and stamps the league. It throws after the league ends, in a finished Season, for a team not in the league, and for a bad level. `leagueOvrOf` now gives the real OVR, so every fixture, matchday, re-scorinate, and bracket tie plays with it. `playPlayoff` plays with the levels of the playoff. `createLeague`, `createSeasonLeague` (through `buildLeagueContent`), and `createPlayoff` take a `conditions` map, check it, and drop the level 0. `isLeagueComplete` in `summarizeLeague.ts` and `getTeamCondition` in `condition.ts` are ready for the screens.
- **Test approach:** 26 new tests. `condition.test.ts` (6): the level and real OVR helpers, and `leagueOvrOf` with levels. `summarizeLeague.test.ts` (2): `isLeagueComplete` (moved there by the refactor pass). `conditionActions.test.ts` (18): the action and each guard, a Season team with a different level in two leagues, a finished Season, the create inputs of the three create actions, and the playoff play against `playTie` with the real OVRs. A fixture test fixes `Math.random`: a league with levels gives the score of a league that stores the real OVRs, and not the score of the stored OVRs. Full suite: 2411 tests pass. Lint, the format check, and the type check pass.
- **Decisions made:** the six choices above. They are in the `PROGRESS.md` Decisions log.
- **What is left, what is next:** Task 228 (the slug list with the level) and the screens (Tasks 229 to 231) can use these actions now. Task 229 also needs Task 227.
- **Refactor:** two changes, no change in behavior. (1) `buildLeagueContent` and `createPlayoff` spread `pickConditions` in the new league or playoff, in place of a `conditions` variable that held a wrapper object, as Task 225 did for `readLeague`. The check still runs before the store changes. (2) The two `isLeagueComplete` tests moved from `condition.test.ts` to `summarizeLeague.test.ts`, beside the function. No markup or CSS change. Lint, the format check, the type check, and the full suite (2411 tests) pass.
