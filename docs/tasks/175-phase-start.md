# Task 175: the phase start: qualifiers in seed order, the phase build, the lock

**Status:** Done

## Goal

Give `engine/phases` the pure functions for the start of a phase (US-07.1, US-07.3): the qualifiers of the phase before it in seed order, the build of a round-robin or Groups phase with its fixture ids, and the lock and complete checks. Split from Task 126 (choice 1). Task 128 calls these functions.

## Acceptance criteria

The user agreed these criteria and choices 1 to 6 on 2026-11-01.

**The qualifiers (US-01.4, US-01.6, Task 78 rule 3):**

- [x] `pickQualifiers(plan, tables, lotOf?)` gives the qualifier team ids in seed order.
- [x] Round robin: the top N of its one table, in table order.
- [x] Groups: all group winners, then all runners-up, and so on to place N. Each place is in the `orderAcrossGroups` order. Then the best M of place N + 1 (`pickBestOfPlace`).
- [x] It throws a `RangeError` for a plan with no advancement, or for a table with fewer rows than the places it needs.

**The build (US-02.2, US-06.1, US-07.3, Task 77):**

- [x] `buildPhase(plan, phase, teams, rng, groups?)` gives the built phase: its fixtures with ids, its byes, and its groups for a Groups phase.
- [x] Round robin: `generateRoundRobin` for two-way, `generateSingleDuels` for single duels, with the teams in seed order. The ids use group 1.
- [x] Groups: one schedule for each group. The ids carry the group number, for example `p2.g3.md1.m2`. Each bye carries its group number.
- [x] Groups with no `groups` argument: a new draw (`drawGroups`) of the teams, with `groupCountFor`. With `groups`: that draw, as it is.
- [x] The same seed gives the same build.
- [x] A bracket plan throws a `RangeError` (choice 4).

**The checks (US-02.1, US-02.5, US-07.3):**

- [x] `isPhaseComplete(fixtures, results)`: true when each fixture has a result.
- [x] `isPhaseLocked(phase, latestStartedPhase)`: true for a phase before the latest started phase.
- [x] `canChangeDraw(results)`: true while the phase has no result. Shuffle and moves follow it.

**Not in this task:** the bracket build (M4, Task 139). The app state and the "Start phase N" button (Task 128). The domain types (Task 128).

## Choices for the user

| # | Choice | Proposal | Flag |
|---|---|---|---|
| 1 | The qualifier input | `pickQualifiers` takes the standings tables, made by the caller with `calculateStandings` and the lots. The engine does not compute the tables again. | |
| 2 | One build entry | `buildPhase` serves phase 1 (the wizard draw, passed as `groups`), a later phase (a new draw), and a Shuffle or move (the new groups, passed as `groups`). | |
| 3 | Groups fixtures and byes | The fixtures come in group order, then matchday order. A new type `GroupBye` adds `group` (from 1) to `Bye`. | |
| 4 | The bracket | `buildPhase` throws a `RangeError` for a bracket until Task 139 (M4). | |
| 5 | The `rng` order | First the draw (when there is no `groups`), then each group's schedule, in group order. | |
| 6 | Small checks | Three functions: `isPhaseComplete`, `isPhaseLocked`, `canChangeDraw`. The app decides the "Start phase N" button from them. | |

## Notes

- **2026-11-01:** Task created by the user's agreement to Task 126 choice 1.
- **2026-11-01:** Started. The app builds phase 1 today in `app/state/leagueWrapperActions.ts` with `generateRoundRobin(uuids, rng)` and `assignFixtureIds(..., { phase: 1, group: 1 })`.
- **2026-11-01:** The user agreed the criteria and choices 1 to 6.
- **2026-11-01:** The user agreed that the task is Done.

## Report

- **What was built:** `engine/phases/phaseStart.ts` with `pickQualifiers`, `buildPhase`, `isPhaseComplete`, `isPhaseLocked`, and `canChangeDraw`. New types `GroupBye` and `BuiltPhase` in `types.ts`. All are exported from `index.ts`.
- **Test approach:** 15 new unit tests in `phaseStart.test.ts`. The tests ran red first (15 of 15), then the code made them pass.
  - The qualifiers: the round-robin top N, Groups place by place with the lots, the football criteria before the lot, the best M after the top N, and the `RangeError` cases.
  - The build: a two-way round robin with `p2.g1` ids, single duels, Groups from a given draw (ids and byes with the group number), the group-then-matchday order, a new draw with no `groups`, the same seed, and the bracket `RangeError`.
  - The three checks.
- **Decisions made:** choices 1 to 6, in the Decisions log (2026-11-01).
- **What is left, what is next:** no caller uses the functions yet. Task 128 adds the domain phase types, calls `buildPhase` at "Create league" and at "Start phase N", and replaces the phase-1 code in `app/state/leagueWrapperActions.ts`. US-07.1 (each phase starts from zero) needs no engine code: `calculateStandings` counts only the results it gets. Task 128 tests it with the app state.
