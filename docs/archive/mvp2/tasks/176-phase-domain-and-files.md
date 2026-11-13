# Task 176: phases in the domain and the database files

**Status:** Done

## Goal

Give the league record the M3 phase shape before the app actions use it: the phase plans of the whole league, the single-duels legs, and the Groups phase with its draw. Save and read that shape in the database files. Split from Task 128 (choice 1). Task 128 then builds the actions on it.

## Acceptance criteria

The user agreed these criteria and choices 1 to 6 on 2026-11-01.

**The domain (`domain/league.ts`, Task 126 choice 6):**

- [x] `League` has `plans: PhasePlan[]` (the `engine/phases` type): the phase chain, fixed at "Create league". `phases` holds only the started phases (choice 2).
- [x] `RoundRobinPhase` has `legs` (`two-way` or `single-duels`).
- [x] A new `GroupsPhase`: `format: 'groups'`, `legs`, `groups` (one list of Blueprint UUIDs for each group), `fixtures`, `byes` with their group number (`GroupBye`), and `results`.
- [x] `PhaseFormat` is `'round-robin' | 'groups'`. The comment names Task 139 for the bracket.
- [x] `WrapperSummary` has `phases: { format, legs }[]` from the plans, in place of `phaseFormats` (choice 4).

**The files (`adapters/json-io`, choice 3):**

- [x] The saved types follow the domain. `DATABASE_FORMAT_VERSION` is 3.
- [x] The parser reads version 3. It also reads version 2, with defaults: `legs` is `two-way`, and `plans` is one two-way round-robin plan for each phase, with no advancement.
- [x] The serializer writes version 3 only.
- [x] A league file fails to parse, with an error message, when:
  - `checkPhaseChain` gives a problem, for example a bracket before the last phase (US-01.3).
  - It has more started phases than plans.
  - A phase format is not the format of its plan.
  - A Groups phase has a team in two groups.
- [x] A round trip (serialize, then parse) gives the same league, for a round-robin league and a Groups league.
- [x] `app/data` maps the new fields both ways.

**What stays the same:** `createLeague` writes `plans: [one two-way round robin]` and `legs: 'two-way'`, so an MVP1-style league plays as before. All current tests pass.

**Not in this task:** the create with plans and groups, the phase start, the progress text, and the lots in the screens (Task 128). The wizard (Tasks 129, 130). The League Detail with phases (Task 131).

## Choices for the user

| # | Choice | Proposal | Flag |
|---|---|---|---|
| 1 | Split Task 128 | New Task 176 (this task) first: the domain and the files. Task 128 keeps the actions: create with plans and groups, start the next phase, the progress text, the lots in the standings. | ⚠ One more task. Two reviews of about 2 hours each. Agreed. |
| 2 | Plans and phases | `plans` holds every phase from the start. `phases` holds only the started ones, so the current phase is still the last one in `phases`. | |
| 3 | The format version | Version 3. The parser reads 2 and 3, and writes 3. An older app cannot open a version-3 database. | ⚠ The rule in `json-io/types.ts`: a change that an older parser cannot read raises the version. A Groups phase is such a change. Agreed. |
| 4 | The manifest row | `phaseFormats` becomes `phases: { format, legs }[]`, from the plans. The dashboard card needs the legs for "Round robin (single duels)", and the plans for a phase that has not started. | ⚠ A manifest shape change, read from version 2 with `two-way`. Agreed. |
| 5 | The bracket plan | A plan can be a bracket now (the engine type). A started bracket phase comes in M4 (Task 139). | |
| 6 | Parse checks | The checks in the criteria. A wrong file stops the open of that league, with the message, as today. | |

## Notes

- **2026-11-01:** Started. Facts from the code: `League.phases` holds `RoundRobinPhase` only (`domain/league.ts`). `DATABASE_FORMAT_VERSION` is 2 (`adapters/json-io/types.ts`), and the parser accepts version 2 only. `WrapperSummary.phaseFormats` comes from the started phases (`app/state/summarizeLeague.ts`). `findCurrentPhase` gives the last phase of `phases` (`app/state/currentPhase.ts`).
- **2026-11-01:** The user agreed the criteria and choices 1 to 6. Task 128 now waits for this task.
- **2026-11-01:** The user agreed that the task is Done.

## Report

- **What was built:**
  - `domain/league.ts`: `League.plans`, `RoundRobinPhase.legs`, the new `GroupsPhase`, and `PhaseFormat` with `groups`. `domain/wrapper.ts`: `PhaseSummary`, and `WrapperSummary.phases` in place of `phaseFormats`.
  - `adapters/json-io`: the saved types follow the domain, `DATABASE_FORMAT_VERSION` is 3, and `OLDEST_DATABASE_FORMAT_VERSION` is 2. The parser reads versions 2 and 3, with version-2 defaults, and checks the plans (`checkPhaseChain`) and the phases against their plans. The error text says "This version reads format versions 2 and 3."
  - `app/data/databaseFile.ts` maps the plans, the legs, the groups, and the summary phases. `summarizeLeague` gives the phases from the plans. `createLeague` writes one two-way round-robin plan and `legs: 'two-way'`.
- **Test approach:** the new and changed parser tests ran red first (21 failed).
  - `database.test.ts`: 12 new tests. A Groups league round trip, a version-2 wrapper and manifest with the defaults, a bracket summary, the four chain texts, bad plan fields, more phases than plans, a format or legs unlike the plan, a team in two groups, a group team outside the league, the group number of a bye. The version tests now expect 3, and the "newer" case uses version 4.
  - `summarizeLeague.test.ts`: 1 new test, a phase that has not started shows in the row.
  - The other tests changed only for the new fields.
- **Decisions made:** choices 1 to 6, in the Decisions log (2026-11-01). Claude choices:
  - A plan number must be a whole number above 0, but the fit rules are not checked at parse: the wizard checks them.
  - A version-2 league with more than one phase fails the chain check, because its default plans have no advancement. The app never made such a file: M1 and M2 make one phase.
  - The first chain problem is the error text.
- **What is left, what is next:** Task 128 adds the actions: the create with the wizard plans and the phase-1 groups, the phase start, the progress text, and the lots in the standings. The screens do not show Groups phases yet (Task 131).
