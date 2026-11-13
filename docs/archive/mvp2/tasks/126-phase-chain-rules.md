# Task 126: phase chain rules: bracket last, fit checks, qualifier counts

**Status:** Done

## Goal

Open `engine/phases` with the pure rules that the wizard (Task 129) and the import (Task 145) need before a league starts: the phase plan shape, the bracket-last check, the fit checks, the qualifier counts, and the best M suggestion (US-01.3, US-01.4, US-01.6).

The board row also named "build and start a phase, the lock". Choice 1 moved that part to Task 175.

## Acceptance criteria

The user agreed these criteria and choices 1 to 6 on 2026-11-01, with the split of choice 1.

**The plan (choice 2):**

- [x] `engine/phases/types.ts` has a `PhasePlan` type: the format (`round-robin`, `groups`, `bracket`), the legs (`two-way`, `single-duels`), the group setting (`GroupSetting`, Task 125), and the advancement (`top` and `bestOfNext`).
- [x] The bracket plan has no settings yet. M4 (Task 140) adds them.

**The chain check (US-01.3):**

- [x] `checkPhaseChain(plans)` gives a list of problems. An empty list means the chain is valid.
- [x] Problems: no phases, a bracket before the last phase, a phase that is not the last with no advancement, and the last phase with an advancement.
- [x] A one-phase bracket league is valid.

**The fit check (US-01.4, US-01.6, US-02.1):**

- [x] `checkPhaseFit(plans, teamCount, firstGroupSizes?)` gives a list of problems, each with its phase number.
- [x] Round robin: `top` is less than 1, or equal to or more than the team count.
- [x] Groups: `top` is less than 1, or equal to or more than the size of the smallest group.
- [x] Groups: M is more than the group count minus 1, or N + 1 is more than the size of the smallest group.
- [x] A group with fewer than 2 teams.
- [x] A phase that gets fewer than 2 teams.
- [x] The team count of each later phase is the qualifier count of the phase before it.

**Counts and the suggestion (US-01.4, US-01.6):**

- [x] `qualifierCount(plan, groupCount)`: `top` for a round robin, groups × `top` + M for Groups.
- [x] `suggestBestM(groupCount, top, smallestGroupSize)` gives the smallest M that makes the count a power of 2, inside the fit range. It gives `undefined` when the count is already a power of 2, or when no M fits. Example: 6 groups × top 2 = 12 gives 4.

**Not in this task:** the qualifiers in seed order, the phase build, the lock (choice 1). The wizard screens (Task 129). The domain types (choice 6). The bracket settings and the power-of-2 warning (M4).

## Choices for the user

| # | Choice | Proposal | Flag |
|---|---|---|---|
| 1 | Split the task | Task 126 keeps the rules before the start: chain, fit, counts, suggestion. A new Task 175 takes the phase start: the qualifiers in seed order, the build of a round-robin or Groups phase with its fixture ids, and the lock and "complete" checks. Task 128 then depends on 175. | ⚠ The board row is large. Two reviews of about 1.5 to 2 hours each. Agreed. |
| 2 | The plan shape | `{ format, legs, grouping, advance?: { top, bestOfNext } }`, in `engine/phases`. Task 128 can use the same type in `domain/`, because `domain/` may import engine types. | |
| 3 | Problems, not messages | Each check gives problem codes with the phase number, for example `{ code: 'bracket-not-last', phase: 2 }`. The screen writes the text (as Tasks 115 and 116). | |
| 4 | Phase 1 group sizes | `checkPhaseFit` takes the real sizes of the phase-1 draw when it has them, because moves can make them uneven. Without them, and for later phases, it uses `groupSizes`. | |
| 5 | One group | Size mode can give 1 group, for example 4 teams with size 4. This is not a problem: it plays as one table. | ⚠ The spec does not say. Count mode already needs 2 or more. Agreed. |
| 6 | The domain comment | `domain/league.ts` says "Task 123 adds single duels, Task 126 the groups". Task 123 did not change `domain/`. Proposal: Task 128 adds the domain phase types for single duels and Groups, and fixes the comment. | ⚠ A gap from Task 123. Agreed. |

## Notes

- **2026-11-01:** Started. `engine/phases` does not exist yet (`module-boundaries.md` lists it since Task 84). The app builds phase 1 in `app/state/leagueWrapperActions.ts` with `generateRoundRobin` and `assignFixtureIds`. The `domain/` `Phase` type has the round robin only.
- **2026-11-01:** The user agreed the criteria and choices 1 to 6. Task 175 is on the board. The Task 128 row names the domain types (choice 6).
- **2026-11-01:** The user agreed that the task is Done.

## Report

- **What was built:** the new module `engine/phases`.
  - `types.ts`: `PhasePlan` (`RoundRobinPlan`, `GroupsPlan`, `BracketPlan`), `Legs`, and the problem types `PhaseChainProblem` and `PhaseFitProblem`.
  - `phaseRules.ts`: `checkPhaseChain`, `checkPhaseFit`, `qualifierCount`, and `suggestBestM`.
- **Test approach:** 27 new unit tests in `phaseRules.test.ts`.
  - The chain: valid one-phase and multi-phase leagues, and each of the four chain problems.
  - The counts, the US-01.6 suggestion examples (12 gives 4), and the cases with no suggestion.
  - The fit: each fit problem, the real phase-1 sizes after a move, one group in size mode, and the counts of later phases.
  - The tests and the code were written in one step, so the tests did not run red first. To make up for it, two mutations ran outside the suite: the Groups top rule with the team count (3 tests fail), and a later phase with the phase-1 team count (1 test fails).
- **Decisions made:** choices 1 to 6, in the Decisions log (2026-11-01). Claude choice: one extra problem code, `grouping-out-of-range`, for a size or count below 2, because `groupCountFor` throws on it. The fit check stops at that phase.
- **What is left, what is next:** no caller uses the module yet. Task 175 adds the phase start to `engine/phases`. Task 129 (the wizard Phases step) writes the problem texts. Task 145 (the league import) uses `checkPhaseChain` for the "bracket not last" import error. Task 128 adds the domain phase types (choice 6).
