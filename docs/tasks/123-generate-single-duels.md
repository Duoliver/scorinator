# Task 123: `generateSingleDuels`, the shared pairing, the doc comment fix

**Status:** Done

## Goal

Give the engine a schedule generator for a single-duels round robin (US-06.1). Each pair of teams meets once. Home and away are random, but each team's home and away counts differ by at most 1. Later M3 tasks (126, 128) call it when a phase starts.

## Acceptance criteria

The user agreed these criteria and choices 1 to 6 on 2026-11-01.

**The function (US-06.1, Task 82):**

- [x] `generateSingleDuels(teams, rng)` in `engine/round-robin` takes a required `rng` and returns a `RoundRobinSchedule<TeamId>` (fixtures and byes).
- [x] It throws a `RangeError` for fewer than 2 teams, as `generateRoundRobin` does.
- [x] Each pair of teams meets once.
- [x] The phase has N − 1 matchdays for an even N. It has N matchdays for an odd N, with one bye on each matchday.
- [x] The pairings follow the team order, from the same circle-method step as `generateRoundRobin`.
- [x] Each team's home and away counts differ by at most 1, and by 0 when N is odd. A test checks this for N from 2 to 20, over many seeds.
- [x] When N is even, the `rng` picks which teams get the extra home match.
- [x] For each pairing, each team is home in 40% to 60% of 2,000 seeds.
- [x] There is no limit on home or away streaks.
- [x] The same seed gives the same schedule.
- [x] The `rng` also shuffles the match order inside each matchday (Task 30).
- [x] `assignFixtureIds` works on its fixtures with no change.

**The shared pairing and the doc comment:**

- [x] One internal helper makes the circle-method pairings. Both generators use it.
- [x] `generateRoundRobin` gives the same output as before, and its tests do not change.
- [x] Its doc comment no longer says that single duels is "MVP2's `groups round robin`".

**Not in this task:** the phase start, the stored schedule, and the fixture ids at the start (Tasks 126, 128). The home boost and the fixtures list already work for any fixture.

## Choices for the user

| # | Choice | Proposal | Flag |
|---|---|---|---|
| 1 | The balance algorithm | Turn each pairing into an edge. Walk an Euler circuit, and the walk direction gives home and away. For an even N, first add a random dummy edge to each team, then drop those edges. The `rng` picks the start, the next edge, and the walk direction. | ⚠ Task 82 left this to the build task. Agreed. |
| 2 | Why choice 1 is fair | Each team gets exactly half its home matches (±1 for an even N). A random walk direction flips every match, so each side of a pairing is home in 50% of seeds on average. | |
| 3 | The helper place | A new file `circlePairing.ts`. The `index.ts` does not export it. | |
| 4 | The `rng` order | First the home and away pick, then the match order shuffle. | |
| 5 | The 2,000-seed test size | Every N from 2 to 20. The balance test uses 200 seeds for each N. | ⚠ Adds about 1 to 3 s to the test run. Agreed. |
| 6 | The new doc comment | "Single duels is `generateSingleDuels`, a separate generator that shares the pairing step (Task 82)." | |

## Notes

- **2026-11-01:** Started. Task 82 settled the new function, the required `rng`, the shared pairing, and the balance rule. It left the algorithm to this task.
- **2026-11-01:** The user agreed the criteria and choices 1 to 6. Task 174 waits until after this task.
- **2026-11-01:** The user agreed that the task is Done.

## Report

- **What was built:** `generateSingleDuels(teams, rng)` in `engine/round-robin/singleDuels.ts`, exported from `index.ts`. The new internal file `circlePairing.ts` holds `pairByCircle` and `shuffleWithinMatchdays`. `generateRoundRobin` now uses both, and its doc comment names `generateSingleDuels`.
- **Test approach:** 12 new unit tests in `singleDuels.test.ts`, some statistical over seeded runs. They check the pair count, the matchdays and byes, the circle-method pairings against the first leg of `generateRoundRobin`, and the balance rule (N 2 to 20, 200 seeds). They also check the 40% to 60% home share for each pairing (N 2 to 20, 2,000 seeds) and the extra-home share for an even N. Determinism, the match order shuffle, `assignFixtureIds`, and no input change are also tested. The statistical tests add about 1.1 s. Two checks outside the suite: (1) the `generateRoundRobin` output for N 2 to 20, with no seed and three seeds, is byte-identical before and after the refactor. (2) A coin-flip home pick makes the balance test fail.
- **Decisions made:** choices 1 to 6, in the Decisions log (2026-11-01).
- **What is left, what is next:** no caller uses the function yet. Task 126 builds a phase with it, and Task 128 stores the schedule at the phase start. Next on the board: Task 124 or 125, both after 122.
