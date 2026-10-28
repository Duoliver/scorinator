# Task 082: settle open decision 8, the single duels generator

**Status:** Done (2026-10-27)

## Goal

Decide if single duels gets a new generator or extends `generateRoundRobin`, and the shape of its `Rng` parameter. Task 91 (Single Duels Home/Away Balancing) builds on this choice.

## Acceptance criteria

- [x] The user picks a new generator or an extension.
- [x] The user confirms the balance rule that the tests check.
- [x] The `PROGRESS.md` Decisions log has an entry for the choices.
- [x] The `PROGRESS.md` Open questions list no longer has decision 8.
- [x] The report below records the choices and their effect on Task 91.

## Notes

- **2026-10-27:** Facts from the code. `generateRoundRobin(teams, rng?)` (`src/engine/round-robin/roundRobin.ts`) pairs teams by the circle method. Leg one alternates home and away by matchday, and leg two mirrors leg one. The optional `rng` (Task 30) only shuffles the match order inside each matchday. Its doc comment says single duels is "MVP2's `groups round robin`, a separate generator". That is not correct: single duels and groups are different formats. The spec asks for home and away "randomized per match", with each team as close to an equal split as possible. Each team plays N − 1 matches, so an exact split is possible only when N − 1 is even.
- **2026-10-27:** The user agreed the criteria. The user chose "New function, shared pairing" and confirmed the balance rule, with no streak limit.

## Report

- **What was built:** no code. Decision 8 is settled.
  1. **Generator:** a new function, `generateSingleDuels(teams, rng)`, with a required `rng`. It shares the circle-method pairing step with `generateRoundRobin`, through one internal helper. `generateRoundRobin(teams, rng?)` and its tests do not change.
  2. **Balance rule:** each team's home and away counts differ by at most 1. They differ by 0 when the team plays an even number of matches, that is, when N is odd. Home and away are random inside that rule. No streak limit.
- **Test approach:** none, no code changed. The balance rule becomes a test over many seeds and team counts, odd and even.
- **Decisions made:** logged in the `PROGRESS.md` Decisions log on 2026-10-27.
- **Effect on other tasks:**
  - **Task 91 (Single Duels Balancing):** the refined stories use this function and rule. The algorithm that keeps the balance while it randomizes is a build-task choice.
  - **Groups (Task 87):** each group calls `generateRoundRobin` or `generateSingleDuels` for its own teams.
  - **Engine:** the `generateRoundRobin` doc comment says single duels is "MVP2's `groups round robin`". Correct it when this code changes.
- **What is left, what is next:** all open decisions except decision 5 (deferred) are settled. The user reviews Tasks 75 to 82.
