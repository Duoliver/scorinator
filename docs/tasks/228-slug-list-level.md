# Task 228: the slug list with the level

**Status:** Refactor

## Goal

The slug list `.txt` file carries the condition level of each team (US-14.4). The export writes the level of each team of the league. The import reads it, and gives the wizard the level of each team it adds. Task 229 puts the levels in the wizard team list, and shows the alert for a level that is not valid.

## Acceptance criteria

- [x] The writer puts the slug, a space, and the level on each line, for example `north-fc +1`. It writes the level for every team, also `0` (US-14.4).
- [x] "Export slug list" writes the level of each team in the league, in the final ranking order.
- [x] The parser reads a line with a level, and a line with no level as level 0. An old slug list file stays valid.
- [x] A line with a level that is not valid gives the team level 0, and the parser reports the line, so Task 229 can show it in an alert. It does not stop the import.
- [x] The import plan gives the level of each Blueprint it adds.
- [x] The parse and the write are pure functions in `adapters/txt`, with unit tests.
- [x] The wizard import works as today, with the new return shape. It does not use the levels yet.
- [x] Lint, the format check, the type check, and the full suite pass.

## Notes

- **2026-11-16:** Started. Inputs: US-14.4 (the line format, the `+` sign, the level 0 written, the alert), US-08.7 and US-10.5, `src/adapters/txt/slugList.ts`, `src/app/data/slugListTxt.ts`, `planSlugListImport` in `src/app/state/teamInstances.ts`, and the import in `useTeamsStep.ts`.
- **2026-11-16:** The wizard team list holds no levels yet: Task 229 adds them. This task stops at the data: the parser, the writer, the export, and the import plan.
- **2026-11-16:** The user agreed the criteria and six choices: (1) the reader takes `-2` to `+2`, also `1` and `2` with no plus. The writer always writes the plus. (2) A line with three parts or more stops the import with the "is not a slug" line error. (3) A line with two parts and a bad level imports the team at level 0, and reports the line. (4) The reader gives `{ entries, badLevels }`. (5) The level of the first copy of a slug counts. (6) `planSlugListImport` gives a `levels` map of the teams it adds.
- **2026-11-16:** Tests first: 28 tests failed before the code, the new ones and the old ones with the old shape. `features/` cannot import `adapters/`, so `app/data/slugListTxt.ts` re-exports the `SlugListFile` type for the wizard. Three tests outside the plan changed for the new shape: the wizard import mocks in `TeamsStep.test.tsx` give a `SlugListFile`, and the smoke test of Task 151 expects `harborview-sc 0` and `salt-marsh-united 0`.
- **2026-11-16:** The user agreed the review. Commit 1, then the refactor pass.

## Report

- **What was built:** `parseSlugList` in `adapters/txt` gives `{ entries: { slug, level }[], badLevels: { line, text }[] }`. A line with no level is level 0, so an old file stays valid. A bad level gives level 0 and a `badLevels` line, and the import goes on. A line with three parts, or a bad slug, still throws the line error. `serializeSlugList` takes `teams: { slug, level }[]` and writes `north-fc +1`, also `0`. "Export slug list" writes the level of each team of the league, from `getTeamCondition`. `importSlugListTxt` gives the file shape. `planSlugListImport` takes the lines and gives `levels`, the level that is not 0 of each Blueprint it adds. The wizard import adds the same teams as before, and does not use the levels yet.
- **Test approach:** unit tests in `adapters/txt/slugList.test.ts`: 7 new for the levels (a level, no level, no plus and tabs, -0, bad levels with their line, a level of 1.5, a bad slug with a level), and the old tests on `slugsOf`. The writer tests write the level and read it back. `app/data`: the import gives the file shape, and the export writes `+2` for a team at +2. `app/state`: 3 new `planSlugListImport` tests for the levels. 11 new tests in all. Full suite: 2429 tests pass. Lint, the format check, and the type check pass.
- **Decisions made:** the six choices above. They are in the `PROGRESS.md` Decisions log.
- **What is left, what is next:** Task 229 puts `plan.levels` in the wizard team list, and shows `badLevels` in an alert, as the slugs that are not found. A comment in `useTeamsStep.ts` marks the place.
- **Refactor:** waits for the review.
