# Task 208: the roster rules of a Season

**Status:** Done

## Goal

Give `engine/identity` the pure rules that a team join to a Season needs: the name of a team that clashes, the order of precedence, and the trigram pick. One shared helper also gives the first free numbered name, "Liga (2)", for the imports of Tasks 234, 243, and 247 (Task 205, M1).

## Acceptance criteria

- [x] A team that joins with the name of a Season team, and has a lower precedence, gets its Location after the name, in brackets (US-13.4).
- [x] A team with no Location gets the first free number in brackets: "Ashfield Rovers (2)". A Location name that also clashes gets the first free number.
- [x] The precedence: the team that joined first, then the higher OVR, then the fixed lot of Task 78.
- [x] The trigram pick of the first batch, and of a later join from the free trigrams, follows the same precedence. A picked trigram never changes on a join.
- [x] One helper gives the first free numbered name for a name that is taken: "Liga (2)", then "Liga (3)" (US-13.11, US-15.5, US-16.1).
- [x] Pure functions, with unit tests written first. No RNG, no `domain/` import (`ENGINE.md`, `DOMAIN.md`).
- [x] The full suite, the type check, the lint, and the format check pass.

## Notes

- **2026-11-13:** Started. Inputs: US-13.4, the agreed M1 demo, `engine/identity` (`pickTrigrams` sorts by Tier, then OVR, then lot, after the fixed trigrams. `fixedLot(leagueId, teamId)`). MVP2 compares team names with `trim().toLowerCase()` (`app/state/teamInstances.ts`). Six choices sent to the user.
- **2026-11-13:** The user agreed five choices, and changed choice 3. (1) `getNumberedName` and `pickJoinNames` in `engine/identity/name.ts`. (2) Names match after a trim, in any case. An accent counts. (3) A taken name that ends in a number counts up from it: "Liga (2)" gives "Liga (3)". (4) The roster names stay. The join goes by the higher OVR, then the lot, which the caller gives. (5) "Name (Location)", or the first free number when that is taken too. (6) No new trigram function: `pickTrigrams` with the roster trigrams as fixed.
- **2026-11-13:** A Claude detail of choice 3, for the review: the count starts one above the number in the name, so "Liga (2025)" gives "Liga (2026)", not "Liga (2)". A name with no number starts at 2.
- **2026-11-13:** Tests first. The 16 new cases of `name.test.ts` failed (no module), then passed. The 2 Season cases of `pickTrigrams` passed at once, as choice 6 said.
- **2026-11-13:** The user agreed the review, and the count from the number in the name ("Liga (2025)" gives "Liga (2026)"). Commit 1. Status Refactor.
- **2026-11-13:** Refactor pass: the rename of `toNameKey`, and the shared test helpers. Waits for the refactor review.
- **2026-11-13:** The user agreed the refactor review. Done.

## Report

- **What was built:** `src/engine/identity/name.ts` with `getNumberedName` and `pickJoinNames`, exported from the `engine/identity` barrel. No change to `pickTrigrams`.
- **Test approach:** unit tests in `name.test.ts`, 16 cases.
  - `getNumberedName`: a free name, the first free number, the count from a number in the name, the case and trim match, the accent.
  - `pickJoinNames`: the Location suffix, the number with no Location, the number when the Location name is taken, the order by OVR and then lot, the names given in one join.
- **Season trigrams:** two new cases in `trigram.test.ts` show the first batch and a later join of a Season. The full suite passes: 2101 tests. The type check, the lint, and the format check pass.
- **Decisions made:** the six choices, with choice 3 as the user changed it (Decisions log).
- **What is left:** Task 211 calls these rules when teams join the roster, with `fixedLot(seasonUuid, blueprintUuid)`. Tasks 234, 243, and 247 call `getNumberedName` for their imports.
- **Refactor:** two changes, no change in behavior. (1) The private helper `toNameKey` is now `getNameKey`: a function name starts with a verb (`coding-standards.md`). A search finds no old name. (2) `trigram.test.ts` had the `team` and `picked` helpers twice. They now sit once at the top of the file, for both `pickTrigrams` blocks. The checks pass again: 2101 tests.
