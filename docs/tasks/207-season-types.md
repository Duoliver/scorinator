# Task 207: the Season record types

**Status:** Refactor

## Goal

Add the record types of a Season to `domain/`: the Season, its wrapper, its playoffs, the finished state, and its manifest row. Tasks 209 to 211 then build the files and the store on them (Task 205, M1).

## Acceptance criteria

- [x] `domain/` has the Season types: the Season, the Season wrapper, the playoff, and the Season manifest row.
- [x] A Season has a UUID, the provenance fields, a name, a year, the finished state, its leagues, and its playoffs (US-13.1, US-13.7, US-13.9, US-11.1).
- [x] The types hold types only, and import only `engine/` types (`DOMAIN.md`).
- [x] Compile-time tests in `src/domain/types.test.ts` check each rule, as for the MVP2 types.
- [x] `DOMAIN.md` lists the new types.
- [x] No MVP2 type changes its meaning. The full suite, the type check, and the lint pass.

## Notes

- **2026-11-13:** Started. Inputs: `PERSISTENCE.md` §2a (the wrapper UUID is the Season UUID), US-13.1 to 13.9, the agreed M1 demo, `engine/tiebreak` (`TieRules`, `TieResult`). The manifest row type `WrapperSummary` has `contentType: 'league'`. Eight places in `src/` read `Manifest.wrappers`. Six choices sent to the user.
- **2026-11-13:** The user agreed the six choices: (1) the `Season` fields and `SeasonWrapper`, (2) the wrapper `teams` order is the join order, (3) each Season league holds `teamUuids`, (4) a `Playoff` with a UUID, `TieRules`, and an optional `TieResult`, (5) a separate `Manifest.seasons` list of `SeasonSummary` rows, (6) no condition or collection fields yet.
- **2026-11-13:** Tests first: 13 compile-time cases failed the type check, then passed. One change to choice 5, for the review: a required `Manifest.seasons` broke 16 places in `app/` (4 in the code, 12 in tests). A hard-coded `seasons: []` there would hide them from the compiler when Task 209 must carry the Seasons. So this task adds the `SeasonSummary` type only, and Task 209 adds the field. Choices 3 and 5 also changed two lines of `PERSISTENCE.md`, as agreed.
- **2026-11-13:** The user agreed the review, with the move of `Manifest.seasons` to Task 209. Commit 1. Status Refactor.

## Report

- **What was built:** `src/domain/season.ts` with `Season`, `SeasonLeague`, and `Playoff`. `src/domain/wrapper.ts` gets `SeasonWrapper` and `SeasonSummary`. The barrel exports all five. `DOMAIN.md` lists them, and `PERSISTENCE.md` §2 and §2a name choices 3 and 5.
- **Test approach:** compile-time checks in `src/domain/types.test.ts`, as for the MVP2 types. They check each field type, that a Season league is a full `League`, and that a Season has no roster of its own. 13 new cases. The full suite passes: 2083 tests. The type check, the lint, and the format check pass.
- **Decisions made:** the six choices, in the `PROGRESS.md` Decisions log. The `Manifest.seasons` field moves to Task 209 (see the notes).
- **What is left:** Task 209 adds `Manifest.seasons` and the Season file. Task 225 adds the condition fields, and Task 234 the collections.
- **Refactor:** waits for the review.
