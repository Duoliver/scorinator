# Task 105: fixture ids, and the result lookup by id

**Status:** Done (2026-10-29)

## Goal

Give each round-robin fixture a stable id, built from its position, so a result finds its fixture by the id (Task 77). In MVP2, matchday numbers start again in each phase, and groups share them, so the MVP1 `(matchday, home, away)` triple no longer names one match. This task adds engine code and one domain type change. Task 108 calls the code when a phase starts.

## Acceptance criteria

**The id (Task 77):**

- [x] `fixtureId({ phase, group, matchday, match })` returns `p{phase}.g{group}.md{matchday}.m{match}`, for example `p1.g2.md3.m4`.
- [x] All four numbers count from 1. A phase with no groups uses group 1.
- [x] A number that is not a whole number of 1 or more makes it throw a `RangeError`.
- [x] Only this function builds an id. No code parses an id: code compares ids as opaque strings. The doc comment says this.

**The ids on a schedule:**

- [x] `assignFixtureIds(fixtures, { phase, group })` returns the same fixtures in the same order, each with its `id`.
- [x] `match` is the place of the fixture inside its matchday, in the list order, from 1. So the ids follow the shuffled match order of Task 30.
- [x] The ids are unique in the schedule. A test checks this for an even and an odd team count.
- [x] The function does not change its input.
- [x] A new type, `PhaseFixture<TeamId>`, is a `Fixture<TeamId>` with an `id`. `generateRoundRobin` does not change.

**The lookups by id:**

- [x] New lookups `findPhaseResult`, `isPhaseMatchdayPlayed`, and `findPhaseCurrentMatchday` take fixtures with an `id` and results with a `fixtureId`: find the result of a fixture, check if a matchday is fully played, and find the current matchday. They give the same answers as the MVP1 lookups.
- [x] The MVP1 lookups (`isSameMatch`, `matchKey`, `findResult`, `isMatchdayFullyPlayed`, `findCurrentMatchday`) and `MatchIdentity` stay, with a `@deprecated` tag that names the new lookup. Task 109 removes them.

**Domain:**

- [x] `RoundRobinPhase.fixtures` becomes `PhaseFixture<string>[]`. The `expectTypeOf` test of Task 104 changes with it.

**Checks:**

- [x] Unit tests for each new function. The MVP1 tests stay and pass.
- [x] No caller changes. `npm run lint`, `npm run format:check`, `npm run type-check`, and `npm test` pass.

**Out of scope:** the bracket ids (`p3.r2.t1.leg1`, `final`, `third`): Task 136. Groups: Task 125 gives each group its number. Single duels: Task 123. The call at phase start: Task 108.

## Notes

- **2026-10-29:** Facts from the code. `engine/round-robin/schedule.ts` has five lookups on the `(matchday, home, away)` triple. Six MVP1 files call them (`resultsTxt.ts`, `useFixtures.ts`, `useMatchdayNav.ts`, `useScoreFlash.ts`, `leagueFile.ts`, `leagueActions.ts`). `generateRoundRobin` makes fixtures with no id. Its optional `rng` shuffles the match order inside each matchday (Task 30). The Task 104 rule applies: the new code sits next to the MVP1 code, which gets a `@deprecated` tag.
- **2026-10-29:** Claude proposed the criteria above, with one naming choice for the user.
- **2026-10-29:** The user agreed the criteria, and chose permanent names for the new lookups: `findPhaseResult`, `isPhaseMatchdayPlayed`, `findPhaseCurrentMatchday`. Task 109 then removes the MVP1 lookups with no rename.
- **2026-10-29:** The user agreed that the task is Done.

## Report

- **What was built:** `src/engine/round-robin/fixtureIds.ts` (new) with `fixtureId` and `assignFixtureIds`. Three lookups by id at the end of `schedule.ts`: `findPhaseResult`, `isPhaseMatchdayPlayed`, `findPhaseCurrentMatchday`. Two new types in `types.ts`: `PhaseFixture` and `FixturePosition`. The five MVP1 lookups and `MatchIdentity` have a `@deprecated` tag. `RoundRobinPhase.fixtures` in `domain/league.ts` is now `PhaseFixture<string>[]`.
- **Test approach:** unit tests, 23 new. `fixtureIds.test.ts` (12): the id format, group 1, the `RangeError` cases and text, the match number inside each matchday, the shuffled order from a seeded `generateRoundRobin`, unique ids for 6 and 5 teams, no input change. `schedule.test.ts` (11): each lookup, a skipped matchday, two matches with the same matchday and teams told apart by the id, and the same answers as the MVP1 lookups. The MVP1 tests did not change, and they pass. Full suite: 725 tests pass. Lint, format check, and type check pass.
- **Decisions made:** the permanent names, in the Notes above and in the `PROGRESS.md` Decisions log on 2026-10-29. Claude choices: `assignFixtureIds` takes the phase and the group, and counts the match number itself. The lookups take the fixture, not the id string, so a caller cannot pass a result id by mistake.
- **What is left, what is next:** no caller uses the new code yet. Task 108 calls `assignFixtureIds` when a phase starts. Task 109 moves the six MVP1 callers to the new lookups, and removes the MVP1 lookups. Next is Task 106, the JSON v2 files.
