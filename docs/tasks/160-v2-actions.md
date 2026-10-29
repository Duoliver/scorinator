# Task 160: the v2 actions

**Status:** Done

## Goal

Give the database store of Task 108 the actions that change it: create and edit a Blueprint, import Blueprints from a team list, create a league with its Instances and phase 1, and scorinate in phase 1. Each action stamps `lastModifiedByInstallation` on the entity it changes (Task 108 choice). Task 109 calls these actions from the screens. This task is split from Task 108 (user choice, 2026-10-29).

## Acceptance criteria

**Blueprints (`app/state/blueprintActions.ts`):**

- [x] `addBlueprint({ name, colour, tier, location, trigrams })` makes a Blueprint with a new UUID (US-11.1) and a unique slug from the name, with the `-2` rule (Task 75, `uniqueSlug`). Both provenance fields are the installation UUID. It returns the Blueprint.
- [x] A name with no letter or number throws the `slug()` `RangeError`, and adds nothing.
- [x] `updateBlueprint(uuid, changes)` changes the name, colour, tier, location, or trigrams. The slug stays the same (US-09.5). It stamps `lastModifiedByInstallation`.
- [x] An update with no real change makes no new object, so nothing becomes unsaved.
- [x] `importBlueprints(records)` follows Task 75: a record whose slug matches a Blueprint updates its name, colour, and tier, and stamps it. A record with a new slug makes a Blueprint with a new UUID. A blank slug gets a unique slug from the name. It returns the counts of new and updated Blueprints.
- [x] A Blueprint change leaves every league Instance as it is (US-09.2).

**Leagues (`app/state/leagueWrapperActions.ts`):**

- [x] `createLeague({ name, homeAdvantage, points, blueprintUuids })` makes a league wrapper with a new UUID. Each Instance copies the name, colour, slug, and tier of its Blueprint, and gets an OVR rolled from the tier (US-09.2).
- [x] Phase 1 is a two-way round robin from `generateRoundRobin`, with the shuffled match order (Task 30) and the fixture ids of `assignFixtureIds` (Task 105). Fixtures name teams by Blueprint UUID.
- [x] The new league is in the store with no saved snapshot, so it is unsaved (Task 108). It returns the wrapper.
- [x] `scorinateFixture(leagueUuid, fixtureId)` plays one fixture of the current phase that has no result. `rescorinateFixture` draws a new score for a fixture that has a result, in the same place in the list. `scorinateMatchday(leagueUuid, matchday)` plays each unplayed fixture of that matchday. Each one stamps the league. They use the MVP1 match rules: the stored OVR and the home advantage flag.
- [x] An edit of an Instance in one league changes no Blueprint and no other league.

**Errors:**

- [x] Each action throws when the database is not open. An unknown Blueprint, league, or fixture throws a `RangeError` that names it.

**Checks:**

- [x] Store tests for each action, with `src/test/databaseRecords.ts`. The MVP1 actions and their tests do not change.
- [x] No caller changes. `npm run lint`, `npm run format:check`, `npm run type-check`, and `npm test` pass.

**Out of scope:** the screens (Task 109). The CSV confirm with the counts (Tasks 117, 119). Blueprint delete (Task 119). The OVR roll at add, the Instance edit, Switch, and Remove (Tasks 120, 121). More phases (Task 128).

## Notes

- **2026-10-29:** Facts from the code. The MVP1 actions are `addTeam`, `updateTeam(index)`, `setTeams` with `mergeImportedTeams` (an upsert by slug), and `addLeague`, `scorinateFixture`, `rescorinateFixture`, `scorinateMatchday` in `leagueActions.ts`. `addLeague` rolls the OVR at create, uses `Math.random` for a fresh seed, and gives a league with fewer than 2 teams an empty schedule. It rejects a taken league slug.
- **2026-10-29:** The user asked Claude to go on with the recommended option at each choice, and to log the choices for discussion later. The criteria above were not agreed one by one. The choices are in "Choices for discussion" below.

## Choices for discussion

Claude chose each one as the recommended option, with no user answer yet.

1. **The OVR roll stays at create in M1.** The MVP1 wizard has no add step for each team. Task 121 moves the roll to the add (Task 81). **User: agreed, 2026-10-29.**
2. **The team import has no confirm in M1**, as in MVP1. Task 119 adds the confirm with the counts (Task 75). `importBlueprints` already returns the counts. **User: agreed, 2026-10-29.**
3. **A league with fewer than 2 teams gets an empty phase 1**, as in MVP1. Task 121 disables "Create league" for a count that does not fit (US-08.8). **User: agreed, 2026-10-29.**
4. **League names do not need to be unique.** Routes use the UUID now (US-11.1), so two leagues with one name no longer share a route. MVP1 rejected a taken slug. **User: agreed, 2026-10-29.**
5. **An update with no real change does nothing** (Task 108 discussion). **User: agreed, 2026-10-29.**
6. **The import keeps the location and the trigrams of an updated Blueprint.** The MVP1 team list has no such columns. Task 117 adds them (US-09.3, US-09.6). **User: agreed, 2026-10-29.**
7. **Two records with the same slug in one file:** the last one wins, as in MVP1 `mergeImportedTeams`. **User: agreed, 2026-10-29.**

## Report

- **What was built:** `src/app/state/blueprintActions.ts` (`addBlueprint`, `updateBlueprint`, `importBlueprints`) and `src/app/state/leagueWrapperActions.ts` (`createLeague`, `scorinateFixture`, `rescorinateFixture`, `scorinateMatchday`). `requireOpenDatabase` in `databaseStore.ts` is the one guard for a closed database, and `databaseActions.ts` uses it too.
- **Test approach:** store tests, 30 new: `blueprintActions.test.ts` (14) and `leagueWrapperActions.test.ts` (16). They cover each criterion: UUIDs, the `-2` slug, the provenance and the stamp (a Blueprint and a league made by another installation get the local `lastModifiedByInstallation`, and keep their `createdByInstallation`), an update with no change, the Task 75 import rules, phase 1 with fixture ids and Blueprint UUIDs, fewer than 2 teams, each scorinate action, and each error. A fixed `Math.random` pins a score, as the MVP1 store tests do. Full suite: 841 tests pass. Lint, format check, and type check pass, with no warning.
- **Decisions made:** the seven choices for discussion above. The user agreed all seven on 2026-10-29.
- **What is left, what is next:** no screen uses the actions yet. Task 109 wires them. `freshSeed` has a copy in the MVP1 `leagueActions.ts`, and Task 109 removes the MVP1 file.
