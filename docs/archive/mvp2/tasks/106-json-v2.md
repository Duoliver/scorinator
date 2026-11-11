# Task 106: JSON v2, the manifest and wrapper files, and the MVP1 file check

**Status:** Done (2026-10-29)

## Goal

Give `adapters/json-io` the JSON format of the two database files: `manifest.json` and `wrapper-{uuid}.json` (Task 76, `PERSISTENCE.md` §2). Each file carries a format version, and the parser checks it. Add a check that finds an MVP1 file, for the import message of US-10.3. This task adds adapter code only. Task 107 writes the text to disk, and Task 108 maps the file types to the domain types.

## Acceptance criteria

**The file types (`adapters/json-io`, its own types, per `DOMAIN.md`):**

- [x] `SavedManifest`: `kind: 'manifest'`, `formatVersion`, `installationUuid`, `blueprints`, `wrappers` (the summary rows).
- [x] `SavedWrapper`: `kind: 'wrapper'`, `formatVersion`, `uuid`, `teams` (the Instances), and `content` (the league with its phases). The wrapper `uuid` is the league `uuid` (`PERSISTENCE.md` §2a), and the parser checks it.
- [x] Each MVP2 file has `formatVersion: 2`. All keys are camelCase, also `createdByInstallation` and `lastModifiedByInstallation`.
- [x] The fields follow the Task 104 domain types: Blueprint, Instance, League, `RoundRobinPhase` with `PhaseFixture` ids, `PhaseResult`, the summary row, and the progress.
- [x] `adapters/` does not import `domain/` (`DOMAIN.md`).

**Write:**

- [x] `serializeManifest` and `serializeWrapper` give JSON with an indent of 2, as the MVP1 save file does.
- [x] A round trip, write then parse, gives the same data. A test checks a manifest and a wrapper with results.

**Parse:**

- [x] `parseManifest(text)` and `parseWrapper(text)` give the file type, or throw an `Error` that says what is wrong, as `parseLeague` does.
- [x] A text that is not JSON, a wrong `kind`, or a missing field each give their own error text.
- [x] A `formatVersion` that is not the current one gives an error. A higher version says that a newer Scorinator made the file.
- [x] Each UUID passes `isUuidV4` (Task 103). Each tier passes `isTier`.
- [x] A missing `location` gives `''`, and missing `trigrams` give `[]` (US-09.3, US-09.6).
- [x] The parser checks the links inside one file. In a manifest: Blueprint UUIDs and slugs are unique, and wrapper UUIDs are unique. In a wrapper: the Instance UUIDs are unique, fixture ids are unique, each result names a fixture of its phase, and each fixture, bye, and result names a team of the wrapper. A result has the same home and away teams as its fixture.
- [x] The parser does not check the links between files, for example a summary row with no wrapper file. Task 108 handles that case (Task 76 edge cases).

**The MVP1 file check (US-10.3):**

- [x] `isMvp1File(text)` returns `true` for an MVP1 league save file (`formatVersion: 1` with `league` and `teams`) and for an MVP1 teams JSON (a plain list). It returns `false` for an MVP2 file and for a text that is not JSON.
- [x] The message text of US-10.3 stays out of this task. Task 149 shows it.

**Checks:**

- [x] Unit tests for each function, as the MVP1 `league.test.ts` does. The MVP1 parsers and their tests do not change.
- [x] No caller changes. `npm run lint`, `npm run format:check`, `npm run type-check`, and `npm test` pass.

**Out of scope:** the league export file and the Blueprint export file (Task 145). The `.zip` (Task 146). The disk writes (Task 107). The map to domain types (Task 108).

## Notes

- **2026-10-29:** Facts from the code. `adapters/json-io` has the MVP1 league save file (`SavedLeague`, `SAVE_FORMAT_VERSION = 1`, `parseLeague`, `serializeLeague`) and `parseTeamsJson`, which reads a plain list. `parseLeague` throws `Save file is invalid: ...` and rejects any other version. It checks no cross-reference: `calculateStandings` throws later. MVP1 `leagueFile.ts` in `app/data` checks that each result has a fixture.
- **2026-10-29:** Claude proposed the criteria above, with three choices for the user.
- **2026-10-29:** The user agreed the criteria and chose: (1) camelCase keys, also for the provenance fields, because camelCase is the project style. (2) A `kind` field and `formatVersion: 2` on each MVP2 file. A field that a later task adds with a default does not change the version. (3) The parser checks the shape and the links inside one file.
- **2026-10-29:** The user agreed that the task is Done.

## Report

- **What was built:** `src/adapters/json-io/database.ts` (new) with `serializeManifest`, `parseManifest`, `serializeWrapper`, and `parseWrapper`. `src/adapters/json-io/mvp1.ts` (new) with `isMvp1File`. The file types (`SavedManifest`, `SavedWrapper`, and their parts) and `DATABASE_FORMAT_VERSION = 2` in `types.ts`. The barrel exports all of them. The MVP1 parsers did not change.
- **Test approach:** unit tests, 37 new. `database.test.ts` (32): the write format, a round trip for a manifest and for a wrapper with a result, each error text (not JSON, wrong kind, newer and older version, bad UUID, bad tier, bad field), the defaults for a missing location and trigram list, each link check (unique UUIDs and slugs, the wrapper UUID, fixture ids unique across phases, teams in the league, results with their fixture, one result for each fixture), and empty lists. `mvp1.test.ts` (5): both MVP1 file types, MVP2 files, and text that is not JSON. Full suite: 762 tests pass. Lint, format check, and type check pass, with no warning.
- **Decisions made:** the three user choices in the Notes above, and in the `PROGRESS.md` Decisions log on 2026-10-29. Claude choices: the error prefixes `manifest.json is not valid:` and `A league file is not valid:`. The progress row must name a phase of the league, with a matchday inside the matchday count. A trigram list is checked as a list of text only: Task 115 checks the code format.
- **What is left, what is next:** no caller uses the new code yet. Task 107 writes the text to disk, and Task 108 maps the file types to the domain types. `database.ts` has its own copy of five small check functions from the MVP1 `league.ts` (`isRecord` and others), because this task did not change the MVP1 parser. The copy can go when the MVP1 save file goes. The test file has one `any` alias, with an `eslint-disable` line and a reason: a test edits the raw JSON to make a bad file.
