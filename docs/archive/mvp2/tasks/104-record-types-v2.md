# Task 104: record types v2, and the database contract

**Status:** Done (2026-10-29)

## Goal

Give `domain/` the MVP2 record types: the Team Blueprint, the Team Instance, the League with phases, the Instance Wrapper, the manifest, and the provenance fields (US-09.2, US-11.1). Give `persistence/` the contract that the database folder adapter implements: read the manifest, read a wrapper, and save the wrappers, then the manifest (Task 76). This task adds types only. Tasks 105 to 109 use them.

## Acceptance criteria

**Domain types (`src/domain/`):**

- [x] `Provenance`: `createdByInstallation` and `lastModifiedByInstallation`, each an installation UUID (US-11.1).
- [x] `TeamBlueprint`: `uuid`, `slug`, `name`, `colour`, `tier`, `location`, `trigrams`, plus `Provenance`. No City, no Crest (Task 74).
- [x] `location` is a string, `''` when empty (US-09.3). `trigrams` is an ordered list of up to 5 codes, `[]` for the code made from the name (US-09.6). The types do not check the 40-character or 5-code limits: Tasks 115 and 119 do.
- [x] `TeamInstance`: `blueprintUuid`, `slug`, `name`, `colour`, `tier`, `ovr`. It has no UUID of its own (US-09.2, US-11.1).
- [x] `League`: `uuid`, `name`, `homeAdvantage`, `points`, `phases`, plus `Provenance`. No league slug, because routes use the UUID (US-11.1).
- [x] `Phase`: a union with a `format` field. In this task it has one member, the two-way round robin, with `fixtures`, `byes`, and `results`.
- [x] A phase result stores a `fixtureId`, not the `(matchday, home, away)` triple (Task 77). Task 105 gives the engine fixtures their ids.
- [x] Fixtures, byes, and results name a team by its Blueprint UUID (US-11.1).
- [x] `InstanceWrapper<T>`: `uuid`, `teams` (the Instances), and `content: T` (`PERSISTENCE.md` §2a). `LeagueWrapper` is `InstanceWrapper<League>`, and its `uuid` is the league UUID.
- [x] `Manifest`: `installationUuid`, `blueprints`, and one summary row for each wrapper.
- [x] `WrapperSummary`: `uuid`, `contentType` (`'league'`), `name`, `teamCount`, `homeAdvantage`, `points`, `phaseFormats`, and `progress` (Task 76 d). `progress` is the current phase with its matchday and matchday count, or completed. Task 108 computes it.
- [x] Each type has a doc comment that names its story or decision.
- [x] The MVP1 types (`TeamRecord`, `LeagueRecord`, `LeagueTeam`, `LeagueResult`, `CreateLeagueInput`) stay, each with a JSDoc `@deprecated` tag that names its v2 type. No new code uses them. Task 109 removes them.

**Persistence contract (`src/persistence/`):**

- [x] `DatabaseFolder` moves text only, as `FileSystem` does: `readManifest()` gives the manifest text, or `null` before the first save. `readWrapper(uuid)` gives one wrapper text.
- [x] `save(wrappers, manifest)` writes each wrapper text, then the manifest text, manifest last. Each file write is atomic (`PERSISTENCE.md` §3). A `null` manifest means that the manifest did not change.
- [x] The doc comment says that the JSON shapes belong to `adapters/json-io` (Task 106), and that `app/data` maps them to the domain types.

**Checks:**

- [x] A type test file (`expectTypeOf` from Vitest) checks the main rules: an Instance has no `uuid`, a result has a `fixtureId`, and a league wrapper holds a `League`.
- [x] `domain/` imports only `engine/` types. `persistence/` imports no `domain/` type.
- [x] `DOMAIN.md` and `PERSISTENCE.md` name the new types.
- [x] No caller changes. `npm run lint`, `npm run format:check`, `npm run type-check`, and `npm test` pass.

**Out of scope:** the trigram that a league picks for each Instance (Task 121, after the pick in Task 115). Groups, single duels, and the bracket. Each later task adds its own fields to these types (Tasks 121, 123 to 126, 136, 137). The JSON format (Task 106), the folder adapter (Task 107), and the stores (Task 108).

## Notes

- **2026-10-29:** Facts from the code. 41 non-test files use the MVP1 domain types. `persistence/types.ts` has `FileSystem` (text only), `TeamListRecord`, and `SaveFileDialog`. The engine `Fixture` has no id yet (Task 105). `DOMAIN.md` says that `adapters/` never imports `domain/`, so the persistence contract cannot use domain types either.
- **2026-10-29:** Claude proposed the criteria above, with four choices for the user.
- **2026-10-29:** Choice 1: the user chose "keep both", and asked to mark the MVP1 types as deprecated. No code uses them after Task 109, so the `@deprecated` tag fits. The editor then shows each old use with a strike line. Choices 2 to 4 wait: the user wants to clarify them first.
- **2026-10-29:** Claude showed what backs each recommendation: the doc rules, its own judgment, and the cost. Choice 2: the user chose the middle option. The Blueprint gets `location` and `trigrams` now, because their rules are settled. The phase formats wait for their tasks. Choice 3: the user chose a contract that moves text only. Claude added an Open question for Task 144: `persistence/` cannot import the domain types. Choice 4 waits.
- **2026-10-29:** Choice 4: the user chose the `expectTypeOf` tests. The criteria are agreed.
- **2026-10-29:** The user agreed that the task is Done.

## Report

- **What was built:** the MVP2 record types in `src/domain/`: `provenance.ts` (new), `team.ts` (`TeamBlueprint`, `TeamInstance`), `league.ts` (`League`, `Phase`, `RoundRobinPhase`, `PhaseResult`, `PhaseFormat`), and `wrapper.ts` (new: `InstanceWrapper`, `LeagueWrapper`, `Manifest`, `WrapperSummary`, `LeagueProgress`). `DatabaseFolder` and `WrapperText` in `src/persistence/types.ts`. The five MVP1 types have a `@deprecated` tag. `DOMAIN.md` and `PERSISTENCE.md` (§2c) name the new types.
- **Test approach:** compile-time tests with `expectTypeOf`, 21 in all: `src/domain/types.test.ts` (17) and `src/persistence/types.test.ts` (4). `npm run type-check` runs them. A check by hand: a `uuid` field put on `TeamInstance` for a moment made the type check fail at the right test line. One limit: a type cannot tell a Blueprint UUID from any other string, so the rule "fixtures name a team by its Blueprint UUID" is in the doc comments only. Full suite: 702 tests pass. Lint, format check, and type check pass.
- **Decisions made:** the four user choices in the Notes above. Claude choices: `PhaseFormat` is `'round-robin'`, with no "two-way" in the name, because the cards show the short name "Round robin" (Task 83), and Task 123 can add single duels as a setting or as a new format. `PhaseResult` keeps `home` and `away`, so `calculateStandings` reads it with no change. `LeagueProgress` counts the phase and the matchday from 1. All in the `PROGRESS.md` Decisions log on 2026-10-29.
- **What is left, what is next:** no caller uses the new types yet. Task 105 adds `id` to the engine `Fixture`. Task 106 writes the JSON shapes. The Instance trigram comes in Task 121. The Open question about Task 144 is in `PROGRESS.md`. The `expectTypeOf` error text is short ("Expected 2 arguments, but got 1"), so the test line, not the message, shows which rule broke.
