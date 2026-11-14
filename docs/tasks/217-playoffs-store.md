# Task 217: playoffs in the store

**Status:** Refactor

## Goal

Give `app/state` the playoffs of a Season: create a playoff with a unique name, two Season teams, and the tie rules, then play it with `playTie` and keep its result. A finished Season stays read only. Task 220 builds the Playoffs tab and the playoff dialog on it (Task 205, M2).

## Acceptance criteria

- [x] The user creates a playoff in an open, running Season: a name, "Team 1" and "Team 2" from the roster, and the tie rules (US-13.7).
- [x] A playoff name is unique in its Season, in any case, with no spaces at the two ends (US-13.7).
- [x] Team 1 plays the first leg of a two-legged tie at home. A single match is at a neutral venue, with Team 1 in the home slot (choice 3, option A).
- [x] Each playoff has its own "Home advantage" switch, for the two legs (Task 215, point 4a).
- [x] The user plays a playoff. The result keeps each match, the AET, the penalties, the winner, and what decided the tie (US-13.7).
- [x] A playoff team plays as its Season team: the current base OVR.
- [x] Each playoff action throws for a finished Season, and changes nothing (US-13.9).
- [x] A change makes the Season unsaved. A save writes the Season file with the playoffs.
- [x] Store tests written first (`docs/tdd.md`). The full suite, the type check, the lint, and the format check pass.

## Notes

- **2026-11-14:** Started. Inputs: US-13.7, the Task 215 demo and its points 4a to 4c, `domain/season.ts` (`Playoff`), `engine/tiebreak` (`playTie`, `TieRules`), `adapters/json-io/season.ts` (the playoff parse, Task 209). Found: `playTie` plays a single match at a neutral venue, with the higher seed in the home slot and no home boost (Task 74, Task 135 choice 4). In a two-legged tie, the lower seed plays the first leg at home. So "Team 1 at home in a single match" needs a choice. Seven choices sent to the user.
- **2026-11-14:** The user answered. Choice 3: option A. A single match stays at a neutral venue, and the switch acts on the two legs only. Choice 6: the missing re-scorinate is a real gap. The user parked it as a future MVP3 feature: `scorinator-future-features.md` §41. The choice of the first home team and a home boost in a single match: §42. Choice 5: the user asked if the old names `homeUuid` and `awayUuid` allow an object shape reuse. Claude answered, and waits for the decision. Choices 1, 2, 4, and 7: no comment yet.
- **2026-11-14:** The user chose the rename of choice 5 (`team1Uuid` and `team2Uuid`), and agreed choices 1, 2, 4, and 7. All seven choices are settled: (1) `createPlayoff` and `playPlayoff` in `seasonPlayoffActions.ts`, `isPlayoffNameTaken` in `databaseStore.ts`. (2) The name and team checks, and the away goals rule off for a single match. (3) Option A. (4) Team 2 is the engine "higher seed" of a two-legged tie. (5) The rename. (6) No re-scorinate (§41). (7) The finished guard and the stamp.
- **2026-11-14:** Tests first: the renamed file tests (8 cases) and 16 new action cases failed, then passed after the build.
- **2026-11-14:** Claude choices in the code, for the review:
  - (a) A single match takes Team 1 as the engine "higher seed", and a two-legged tie takes Team 2. So Team 1 has the home slot of a single match and of its replay, and Team 2 has the home slot of a two-legged replay. Both replays are at a neutral venue.
  - (b) `playPlayoff` takes an optional RNG, as `addSeasonTeams` does, so a test can predict the result.
  - (c) `isPlayoffNameTaken` takes one Season wrapper, not the whole store: a playoff name is unique in its Season only.
  - (d) The file message for one team twice is now "has the same team as Team 1 and Team 2."
  - (e) The rename keeps the file format version 5: no saved file has a playoff yet (choice 5).
- **2026-11-14:** The user agreed the review and the Claude choices (a) to (e). Commit 1. Status Refactor.
## Report

- **What was built:**
  - `app/state/seasonPlayoffActions.ts`: `createPlayoff`, `playPlayoff`, and the `PlayoffInput` type.
  - `app/state/databaseStore.ts`: `isPlayoffNameTaken`.
  - `domain/season.ts`, `adapters/json-io/season.ts` and `types.ts`, `app/data/databaseFile.ts`: the playoff fields `homeUuid` and `awayUuid` are now `team1Uuid` and `team2Uuid`.
  - `docs/scorinator-future-features.md`: §41 (play a playoff again) and §42 (the home team of a playoff).
- **Test approach:** store tests on the in-memory folder (`seasonPlayoffActions.test.ts`, 16 cases): the create, the name and team checks, the play in both formats against `playTie` with the same seed, the stamp, no second play, the finished guard, and the save. The file and type tests follow the rename. The full suite passes: 2263 tests. The type check, the lint, and the format check pass.
- **Decisions made:** the seven choices, and the two parked features (Decisions log). The Claude choices (a) to (e) are in the notes.
- **What is left, what is next:** Task 220 builds the Playoffs tab and the playoff dialog on these actions. M3 adds the condition of a playoff team (US-14.3).
- **Refactor:** waits for the review.
