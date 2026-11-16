# Task 225: the condition data

**Status:** Refactor

## Goal

Store a condition level for each team in each league, standalone or in a Season, and for each team of a Season playoff (US-14.1 to US-14.3). The league files, the Season files, the league export, and the database zip keep the levels. No screen and no action uses them yet: Task 226 adds the actions.

## Acceptance criteria

- [x] `domain/` has the condition levels of a league and of a playoff (choices 1 to 3).
- [x] A wrapper file, a Season file, and a league file write the levels and read them back with no change.
- [x] A file with no levels reads as level 0 for every team. A file of format version 2 to 5 stays valid.
- [x] The reader rejects a level that is not -2 to 2, and a level for a team that is not in the league or the playoff, with a clear error.
- [x] A league with all teams at level 0 writes the same file as before this task.
- [x] `app/data` maps the levels between the file and the domain, so a save and a load keep them.
- [x] Unit tests in `adapters/json-io` for the read, the write, and each error. A round-trip test in `app/data`.
- [x] Lint, the format check, the type check, and the full suite pass.

## Notes

- **2026-11-16:** Started. Inputs: US-14.1 to US-14.3, `src/domain/DOMAIN.md`, `src/persistence/PERSISTENCE.md`, `src/adapters/json-io/types.ts` (the version rule: a new field with a default keeps the version), `database.ts`, `season.ts`, and `src/app/data/databaseFile.ts`.
- **2026-11-16:** A Season wrapper holds one Instance for each roster team, shared by all its leagues. US-14.2 gives one Season team a different level in each league, so the level cannot live on the Instance. About 43 files build a league or a playoff object, most of them tests: an optional field keeps them as they are.
- **2026-11-16:** The user agreed the criteria and seven choices: (1) a `conditions` map on the league, not on the Instance. (2) An optional `Record<blueprintUuid, ConditionLevel>`, absent means 0. (3) The same map on `Playoff`, with Team 1 and Team 2 as keys. (4) The writer keeps only the levels that are not 0. (5) A bad level or an unknown team makes the file invalid. (6) Format version 5 stays. (7) `app/data` maps the field.
- **2026-11-16:** Tests first: 18 of the new tests failed before the code. One stray comment in `databaseFile.ts` sat above `mapLeagueToFile`, with the text of `leagueToFile`. It moved back above `leagueToFile`, next to the new `conditionsCopy` helper.
- **2026-11-16:** The user agreed the review. Commit 1, then the refactor pass.

## Report

- **What was built:** `League.conditions` and `Playoff.conditions` in `domain/`, with a `ConditionLevels` type. `SavedWrapperLeague.conditions` and `SavedPlayoff.conditions` in `adapters/json-io`, with one shared reader, `readConditions`. It checks each level and each team, and drops a level 0. `app/data/databaseFile.ts` copies the levels that are not 0 in both directions, through `conditionsCopy`. The league export and the database zip use the same maps and readers, so they carry the levels too. `DOMAIN.md` names the new type.
- **Test approach:** unit tests in `adapters/json-io`: 11 for a league (round trip, no field, a version 4 file, level 0 dropped, seven bad inputs) and 7 for a Season (a different level in each league, a roster team not in the league, playoff round trip, playoff level 0, three bad playoff inputs). 4 round-trip tests in `app/data`, one of them checks that a league with all levels at 0 writes the same text as before. Full suite: 2385 tests pass. Lint, the format check, and the type check pass.
- **Decisions made:** the seven choices above. They are in the `PROGRESS.md` Decisions log.
- **What is left, what is next:** no action reads or sets a level yet. Task 226 adds the actions, the lock after the league ends, and the real OVR in scorination.
- **Refactor:** waits for the review.
