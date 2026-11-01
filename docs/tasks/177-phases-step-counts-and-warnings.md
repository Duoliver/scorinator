# Task 177: Phases step counts, best M suggestion, and warnings

**Status:** Done

## Goal

Show the user what the phase chain gives before "Create league" (US-01.4, US-01.5, US-01.6, US-01.2 note, US-02.1 summary): the team count of each phase, the best M suggestion for a bracket, the fit warnings with their texts, and the reason on a disabled "Create league". Split from Task 129 (choice 1).

## Acceptance criteria

The user agreed these criteria, choices 1 to 6, and the texts on 2026-11-01.

**The counts (US-01.4, US-01.6, US-02.1):**

- [x] `phaseTeamCounts(plans, teamCount, firstGroupSizes?)` in `engine/phases` gives the team count and the group sizes of each phase. `checkPhaseFit` uses it, so the two never differ (choice 1).
- [x] A Groups phase card shows its sizes, for example "5 groups: 4, 4, 4, 3, 3".
- [x] A card that is not the last shows its qualifiers, for example "4 groups × top 2 = 8 teams go to phase 2", or "6 groups × top 2 + best 4 of place 3 = 16 teams go to phase 2", or "Top 4 = 4 teams go to phase 2".
- [x] The counts show once the team list has 2 teams or more (choice 3).

**The suggestion (US-01.6):**

- [x] When the next phase is a bracket, a Groups card shows the `suggestBestM` result: "6 groups × top 2 = 12. Best 4 of place 3 give 16." and a button "Use best 4".
- [x] The button sets the best M field and the plan.
- [x] No suggestion when the count is already a power of 2, or when no M fits.

**The warnings (US-01.4, US-01.5, US-08.8):**

- [x] Each `checkPhaseChain` and `checkPhaseFit` problem has a text (choice 2). The Phases step shows a problem under the card of its phase.
- [x] The texts update when the team list or a phase changes.
- [x] The Review step lists every problem.
- [x] "Create league" is disabled for a problem, with the text of the first problem as the reason.
- [x] The US-01.5 warning on the Phases and Review steps when the last phase is Groups: "This league ends with groups. Each group winner is a champion. There is no single league winner." It does not block "Create league".

**The note (US-01.2):**

- [x] The Phases step shows: "The league's home advantage applies to round-robin and group phases, and to two-legged ties only." (choice 5).

**Not in this task:** the phase-1 draw on the Teams step (Task 130), which then gives `firstGroupSizes`. The layout polish (Task 178).

## Choices for the user

| # | Choice | Proposal | Flag |
|---|---|---|---|
| 1 | Where the counts come from | A new `phaseTeamCounts` in `engine/phases`. `checkPhaseFit` uses it, and the screen uses it. One walk of the chain, in one place. | |
| 2 | The problem texts | One function, `phaseProblemText`, in `features/leagues`. The texts are in the table below. | ⚠ New user-facing texts. Agreed. |
| 3 | Before the teams | With fewer than 2 teams, the Phases step shows no counts and no fit problems, only "The counts show when the league has 2 teams." The Review step already says "The league needs at least 2 teams to start." | |
| 4 | The look | A problem is a line in the error colour under its card. The US-01.5 warning is a line in the muted colour. Task 178 can change the look. | |
| 5 | The note text | "The league's home advantage applies to round-robin and group phases, and to two-legged ties only." | ⚠ New text. US-01.2 gives the content, not the words. Agreed. |
| 6 | Two problems at once | "Create league" shows the first one. The Review step lists all of them. | |

**The proposed texts (choice 2):**

| Code | Text |
|---|---|
| `too-few-teams` | Phase 2 gets 1 team. A phase needs at least 2 teams. |
| `grouping-out-of-range` | Phase 1: the group size must be a whole number of 2 or more. (or "the group count") |
| `group-too-small` | Phase 1: group B has 1 team. A group needs at least 2 teams. |
| `top-out-of-range` | Phase 1: Top must be a whole number from 1 to 3. (or "No Top fits phase 1. Each group needs more teams." when the max is less than 1) |
| `best-m-out-of-range` | Phase 1: Best of place 3 must be a whole number from 0 to 5. |
| `best-m-place-missing` | Phase 1: the smallest group has no place 3. |
| `bracket-not-last` | Phase 1 is a bracket. A bracket must be the last phase. |
| `missing-advancement`, `advancement-on-last`, `no-phases` | The wizard does not make these. Plain texts for safety: "Phase 1 has no Top.", "Phase 2 is the last phase, but it has a Top.", "Add a phase." |

## Notes

- **2026-11-01:** Task created by the user's agreement to Task 129 choice 1.
- **2026-11-01:** Started. Facts from the code: `checkPhaseFit` walks the chain inside `engine/phases/phaseRules.ts`, and nothing else gives the per-phase counts. `PhaseCard` (Task 129) has uncontrolled number fields, so the suggestion button sets the field through its `FieldHandle`.
- **2026-11-01:** The user agreed the criteria, choices 1 to 6, and the texts.
- **2026-11-01:** Claude choices found during the build: "No Top fits phase 1. The phase needs more teams." for a round robin with a max below 1 (the agreed text names groups). The suggestion hides when the plan already has the suggested M. The Phases step shows a problem with no phase (only `no-phases`) above the cards.
- **2026-11-01:** Look check: a temporary demo page in Vite, opened in headless Chromium, with 22 teams and a Groups → Round robin → Bracket chain. The count lines, a Top problem, and the notes show as intended. The demo page is deleted.
- **2026-11-01:** The user agreed that the task is Done.

## Report

- **What was built:**
  - `engine/phases/phaseRules.ts`: `phaseTeamCounts` (new, exported with `PhaseTeamCount`). `checkPhaseFit` now walks the chain through it, so the screen and the check never differ.
  - `features/leagues/LeagueSetupScreen/phaseChecks.ts` (new): `phaseChecks`, `phaseProblemText`, `phaseCountLines`, `bestMSuggestion`, `endsWithGroups`, and the three note texts.
  - The Phases step takes `teamCount`, and a new `usePhasesStep` hook gives each card its count lines, its problems, and its suggestion. The "Use best M" button sets the plan and the field.
  - The wizard disables "Create league" with the first problem text. The Review step lists all problems and the US-01.5 warning.
- **Test approach:** 25 new tests. The tests ran red first.
  - `phaseRules.test.ts` (6): `phaseTeamCounts`, and a `checkPhaseFit` guard for a Top that is not a number (it passed before the change too). The other 27 engine tests still pass after the refactor.
  - `phaseChecks.test.ts` (12): the problem texts, the count lines, the suggestion, and `endsWithGroups`.
  - `PhasesStep.test.tsx` (5): the notes before 2 teams, the count lines, the suggestion button, a problem that updates, and the groups warning.
  - `LeagueSetupScreen.test.tsx` (2): the Create reason with the Review list, and the groups warning with Create on.
- **Decisions made:** choices 1 to 6 and the texts, in the Decisions log (2026-11-01), and the Claude choices in the Notes.
- **What is left, what is next:** Task 130 gives the real phase-1 group sizes (`firstGroupSizes`) from the Teams step draw. The look can change in Task 178.
