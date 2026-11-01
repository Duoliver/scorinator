# Task 175: the phase start: qualifiers in seed order, the phase build, the lock

**Status:** Not started

## Goal

Give `engine/phases` the pure functions for the start of a phase (US-07.1, US-07.3): the qualifiers of the phase before it in seed order, the build of a round-robin or Groups phase with its fixture ids, and the lock and complete checks. Split from Task 126 (choice 1). Task 128 calls these functions.

## Acceptance criteria

To agree with the user when the task starts. Draft scope from the Task 126 split:

- [ ] The qualifiers of a round robin: the top N of its table, in table order (Task 124 lots).
- [ ] The qualifiers of a Groups phase in seed order (Task 78 rule 3): all group winners, then all runners-up, and so on, then the best M of place N + 1 (`orderAcrossGroups`, `pickBestOfPlace`).
- [ ] The build of a round-robin phase: `generateRoundRobin` or `generateSingleDuels`, with the qualifiers in seed order as the team order, and the fixture ids (Task 77).
- [ ] The build of a Groups phase: one schedule for each group, with the group number in the fixture ids (US-02.2).
- [ ] A phase is complete when each fixture has a result. A phase before the latest started phase is locked.
- [ ] A later Groups phase allows Shuffle and moves until its first result.

**Not in this task:** the bracket build (M4). The app state (Task 128).

## Notes

- **2026-11-01:** Task created by the user's agreement to Task 126 choice 1.

## Report

Write this before the task goes to Review.
