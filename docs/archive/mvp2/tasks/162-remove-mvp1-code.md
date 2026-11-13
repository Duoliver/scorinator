# Task 162: remove the MVP1 code

**Status:** Done

## Goal

Remove the MVP1 league code that has no caller since Task 161: the domain types, the stores, the league save files, and the triple lookups. The app then has one model, the v2 model. The user sees no change.

## Acceptance criteria

The user agreed these criteria and the four choices below on 2026-10-29.

- [x] `TeamRecord`, `LeagueRecord`, `LeagueTeam`, `LeagueResult`, and the MVP1 `CreateLeagueInput` go from `domain/`. `DOMAIN.md` says so.
- [x] `leagueStore.ts`, `leagueActions.ts`, and `app/data/leagueFile.ts` go, with their tests.
- [x] `fileStore` keeps only the status line. `currentLeagueSlug`, `paths`, `savedLeagues`, `isLeagueUnsaved`, `setCurrentLeague`, `setLeaguePath`, and `markLeagueSaved` go.
- [x] The MVP1 league save format goes from `adapters/json-io`: `parseLeague`, `serializeLeague`, and the `Saved*` MVP1 types. `isMvp1File` still knows an MVP1 file (US-10.3).
- [x] The triple lookups go from `engine/round-robin`: `isSameMatch`, `matchKey`, `findResult`, `isMatchdayFullyPlayed`, `findCurrentMatchday`, and `MatchIdentity` (Task 105).
- [x] The results text adapter finds a result by its fixture id.
- [x] No `@deprecated` tag is left in `src/`.
- [x] `npm run lint`, `npm run format:check`, `npm run type-check`, `npm test`, and `npm run build` pass.

**Out of scope:** the team list file formats (CSV, and the JSON plain list), which Tasks 117 and 145 change. The rename of `fileStore` (Task 164, after Task 158).

## Notes

- **2026-10-29:** Facts from the code. 24 files outside the removed files use an MVP1 type or a triple lookup. `TeamRecord` types the team form values, the Teams screen rows, the wizard team rows, and the CSV export. The results text adapter keys its results with `matchKey`.

## Choices for discussion

| # | Choice | Effect | Undo cost |
|---|---|---|---|
| 1 | A new domain type `TeamFields` (slug, name, colour, Tier) replaces `TeamRecord` for the team form values. The lists use `TeamBlueprint`. | No visible effect. | Low |
| 2 | The results text adapter takes the v2 fixture ids. | No visible effect. Task 148 rewrites the text. | Low |
| 3 | `fileStore` keeps its name, with the status line only. | No visible effect. A rename can be its own task. | Low |
| 4 | `isMvp1File` keeps its own MVP1 format version, 1. | No visible effect. | Low |

## Report

- **What was built:**
  - Removed `leagueStore.ts`, `leagueActions.ts`, `app/data/leagueFile.ts`, and `adapters/json-io/league.ts`, with their tests.
  - `domain/`: the MVP1 types are gone. New `TeamFields` types the team form values and the CSV export. The Teams screen rows, the wizard rows, and the Review list use `TeamBlueprint`.
  - `fileStore` holds `status` only. `fileActions.ts` holds `setFileStatus` and `clearFileStatus`.
  - `adapters/json-io`: the MVP1 save types and `SAVE_FORMAT_VERSION` are gone. `isMvp1File` keeps its own `MVP1_SAVE_FORMAT_VERSION = 1`.
  - `engine/round-robin`: the triple lookups and `MatchIdentity` are gone. The results text adapter takes `PhaseFixture` and a `fixtureId` on each result, so `app/data/resultsTxt.ts` passes the current phase as it is.
  - Docs: `DOMAIN.md`, `FEATURES.md`, `module-boundaries.md` (the example names only), and the store example in `coding-standards.md` name the v2 code.
- **Test approach:** no new behavior, so no new tests beyond the moved ones. The results text tests use fixture ids, and the Review step test uses `blueprint()`. The tests of the removed code go with it. Full suite: 718 tests pass, down from 803. Lint, format check, type check, and `npm run build` pass. No `@deprecated` tag is left in `src/` code.
- **Decisions made:** the four choices above, agreed by the user.
- **What is left, what is next:** `FileCard` keeps its unused `footer` prop. The Teams screen row comment still says that two teams can share a slug, and Task 119 reworks that screen. Task 164 renames `fileStore`. Next is Task 110, the M1 smoke check, which the user does in the real app.

