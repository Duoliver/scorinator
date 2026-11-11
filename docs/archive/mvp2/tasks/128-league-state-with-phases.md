# Task 128: league state with phases: create with plans, start the next phase, the progress text

**Status:** Done

## Goal

Make the app state run a league phase by phase (US-01.2, US-07.1, US-07.3): create a league from the wizard plans and the phase-1 draw, start the next phase from the qualifiers, and show the progress between phases. The screens get the fixed lots (Task 124 choice 3). The domain and the files came first, in Task 176.

## Acceptance criteria

The user agreed these criteria and choices 1 to 6 on 2026-11-01.

**Create (US-07.3, US-08.8):**

- [x] `CreateLeagueInput` gets `plans` (default: one two-way round robin) and `groups` (the phase-1 draw of a Groups plan, as Blueprint UUIDs).
- [x] `createLeague` throws a `RangeError`, and adds nothing, for a `checkPhaseChain` or `checkPhaseFit` problem. The fit check uses the real sizes of `groups`.
- [x] Phase 1 comes from `buildPhase`, with the team list order, or with `groups`. A bracket phase 1 throws until Task 139.

**The phase tables (US-07.1, Task 124):**

- [x] `phaseStandings(wrapper, phaseIndex)` gives one table for each group, or one table for a round robin. Each table counts only the results of its own phase and group. The lots come from `fixedLot(league UUID, team UUID)`.
- [x] A test checks US-07.1: a team with points in phase 1 has 0 points in phase 2 before its first result.

**Start the next phase (US-07.3):**

- [x] `canStartNextPhase(wrapper)`: true when the current phase is complete and a next plan exists.
- [x] `startNextPhase(leagueUuid)` picks the qualifiers (`pickQualifiers`), builds the next phase (`buildPhase`), adds it to `phases`, and stamps the league with the local installation. It throws a `RangeError` when `canStartNextPhase` is false.
- [x] The earlier phases do not change. The scorinate actions change the current phase only, so an earlier phase is locked.

**A later Groups draw (US-02.1, US-02.5, choice 5):**

- [x] `shuffleCurrentGroups(leagueUuid)` draws the current Groups phase again, and `moveTeamInCurrentGroups(leagueUuid, team, groupIndex)` moves one team. Each one builds the fixtures again.
- [x] Both work only on a Groups phase after phase 1, while it has no result (`canChangeDraw`). Otherwise they throw a `RangeError`.

**The progress (US-01.2, US-07.3):**

- [x] Between the end of a phase and the next start, the manifest row shows the last progress of the complete phase, for example phase 1, MD 6 of 6.
- [x] The row shows "completed" only when the last planned phase is complete.

**The lots in the screens (Task 124 choice 3):**

- [x] `useStandings` reads the table of the current phase from `phaseStandings`, with the lots and the teams of that phase.
- [x] The results `.txt` export uses the same lots.

**Not in this task:** the wizard Phases and Teams steps (Tasks 129, 130). The League Detail tabs, group cards, and Groups fixtures (Task 131). The "Start phase N" button, its confirm, and the lock hint (Task 132).

## Choices for the user

| # | Choice | Proposal | Flag |
|---|---|---|---|
| 1 | The create input | `plans` and `groups` on `CreateLeagueInput`. Without them, the league is an MVP1-style round robin. | |
| 2 | A create that does not fit | `createLeague` throws for a chain or fit problem. The MVP1 empty phase for fewer than 2 teams goes: the wizard already disables "Create league" then (Task 121), and `checkPhaseFit` gives `too-few-teams`. | ⚠ A behaviour change, and one MVP1 test changes. Agreed. |
| 3 | The team order of a later round robin | No new stored field. `phaseStandings` takes the teams in the order of their first fixture or bye. The lots decide a tie, so the order matters only for two equal lots. | |
| 4 | A start that is not allowed | `startNextPhase` throws a `RangeError`. The screen uses `canStartNextPhase` to show the button (Task 132). | |
| 5 | Shuffle and moves of a later Groups phase | Two app actions in this task. US-07.3 needs them, and Task 131 or 132 adds the buttons. | ⚠ The board row does not name them. Agreed. |
| 6 | `useStandings` with Groups | Until Task 131 adds the group cards, `useStandings` shows the first table of the current phase. A Groups league shows group A only. | ⚠ A short gap. No wizard makes a Groups league before Task 129. Agreed. |

## Notes

- **2026-11-01:** Started. Facts from the code: `createLeague` builds one two-way round robin, and gives an empty phase 1 for fewer than 2 teams (`app/state/leagueWrapperActions.ts`). The scorinate actions change only `findCurrentPhase`, the last started phase. `useStandings` and `app/data/resultsTxt.ts` use all league teams and no lots.
- **2026-11-01:** The user agreed the criteria and choices 1 to 6.
- **2026-11-01:** Claude choice found during the build: a move that leaves a group with fewer than 2 teams throws a `RangeError` ("A group needs at least 2 teams."), because that group has no schedule. The screen must keep such a move off (Task 131 or 132). The test draw of a later Groups phase uses 5 qualifiers (3 and 2), so a valid move exists.
- **2026-11-01:** The user agreed that the task is Done.

## Report

- **What was built:**
  - `app/state/phases.ts` (new): `phaseStandings`, `canStartNextPhase`, and `leagueLotOf`.
  - `app/state/leagueWrapperActions.ts`: `createLeague` takes `plans` and `groups`, checks them, and builds phase 1 with `buildPhase`. New actions `startNextPhase`, `shuffleCurrentGroups`, and `moveTeamInCurrentGroups`.
  - `app/state/summarizeLeague.ts`: the progress stays on the last matchday between phases, and "completed" needs the last planned phase.
  - `features/standings/useStandings.ts` reads `phaseStandings`. `adapters/txt/resultsTxt.ts` takes an optional `lotOf`, and `app/data/resultsTxt.ts` passes the league lots.
- **Test approach:** the tests ran red first. 29 new tests, and 1 changed.
  - `phases.test.ts` (8): one table or one per group, own results only, the lot order, US-07.1 (0 points in phase 2), a phase not started, and `canStartNextPhase`.
  - `leagueWrapperActions.test.ts` (15 new, 1 changed): create with plans and groups, single duels, chain and fit errors; the phase start with the group winners, the lock, a later Groups draw; shuffle, move, a move that leaves 1 team, and the `RangeError` cases. The MVP1 "fewer than 2 teams" test now expects a `RangeError` (choice 2).
  - `summarizeLeague.test.ts` (2), `useStandings.test.ts` (2), the results adapter (1) and export (1): the progress between phases, and the lots.
  - The scores are random (`freshSeed`), so the phase-start tests compare with `phaseStandings`, not with fixed teams.
- **Decisions made:** choices 1 to 6, in the Decisions log (2026-11-01), and the small-group move (Notes).
- **A change you can see now:** the standings screen and the `.txt` export order level teams by the lots. A new league with no results no longer lists its teams in the team list order.
- **What is left, what is next:** no screen calls the new actions yet. Task 129 (the wizard Phases step) gives `createLeague` its plans, Task 130 the phase-1 groups. Task 131 shows the group tables. Task 132 adds "Start phase N", its confirm, and the Shuffle and move buttons of a later Groups phase.
