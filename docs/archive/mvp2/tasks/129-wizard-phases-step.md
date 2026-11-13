# Task 129: wizard Phases step: phases, formats, groups setting, advancement

**Status:** Done

## Goal

Add the Phases step to the League Setup wizard (US-01.1 to US-01.4, US-01.6, US-02.1 setting): the user builds the phase chain, and "Create league" sends it to `createLeague` (Task 128). Choice 1 moves the counts, the suggestion, and the warnings to new Task 177.

## Acceptance criteria

The user agreed these criteria and choices 1 to 6 on 2026-11-01.

**The wizard (US-01.1):**

- [x] Four steps, in order: Details, Phases, Teams, Review. "Next" on Details goes to Phases.
- [x] A new draft starts with one phase: Round robin (two-way), with no advancement. With no change, the league plays as an MVP1 league.
- [x] The draft store keeps the plans, so a nav switch does not lose them.

**The phase cards (US-01.1, US-01.2, handoff):**

- [x] One card for each phase: its number badge (`1`, `2`), its short name ("Round robin", "Group Stage", "Bracket"), and the actions ↑, ↓, ✕ as icon buttons with an `aria-label`.
- [x] "+ Add phase" adds a phase at the end (choice 5). ✕ is disabled with one phase. ↑ is disabled on the first phase, ↓ on the last.
- [x] The format field has the five labels of US-01.2. A change keeps the phase in its place.
- [x] The intro line of the handoff: "A league runs as a sequence of phases. Stats reset to zero between phases. Bracket may only be the final phase."

**The bracket rule (US-01.3):**

- [x] The format field offers Bracket only on the last phase.
- [x] When the last phase is a bracket, "+ Add phase" is disabled, with the hint "A bracket must be the last phase."
- [x] A move that puts a bracket before another phase is disabled.
- [x] A remove can leave a bracket as the only phase.

**Groups (US-02.1):**

- [x] A Groups phase has "Set by" (Group size or Group count, choice 3) and a number field. The default is size 4.

**Advancement (US-01.4, US-01.6):**

- [x] Each phase except the last has "Top N": "Top N advance to the next phase", or "Top N advance per group" for Groups.
- [x] A Groups phase that is not the last also has "Best M of place N + 1", default 0.
- [x] A phase that becomes the last (remove, move) loses its advancement. A phase that stops being the last gets the default (choice 5).

**Create and Review:**

- [x] "Create league" sends the plans to `createLeague`.
- [x] The Review step lists the phases in order, with the full label and the detail, for example "2 · Group Stage · Groups round robin (two-way) · size 4 · Top 2 advance per group".
- [x] While a phase is a bracket, "Create league" is disabled, with the reason "Bracket phases come in a later update." (choice 2).

**Not in this task (Task 177):** the qualifier count lines, the best M suggestion, the fit warnings and their texts, the Create reason for a fit problem, the "groups last" warning (US-01.5), and the home-advantage note. **Not in M3:** the bracket settings (Task 140).

## Choices for the user

| # | Choice | Proposal | Flag |
|---|---|---|---|
| 1 | Split Task 129 | Task 129: the phase editor, the draft, the create, the Review list. New Task 177: the counts, the suggestion, the warnings and their texts. | ⚠ One more task. About 3 hours, then about 2 hours. Agreed. |
| 2 | Bracket before M4 | The format field offers Bracket, and the bracket rules work. But "Create league" stays disabled while a phase is a bracket. A league could not start its bracket phase before Task 139. | ⚠ The user sees Bracket but cannot create with it yet. Agreed. |
| 3 | The "Set by" control | A `Select` (Group size, Group count) and a number `Input`. The segmented control comes in Task 138 (M4) and can replace the `Select` then. | ⚠ Not the handoff look. The handoff has a group count field only. Agreed. |
| 4 | A bad number | The field keeps the text. A number that is not whole gives `NaN` in the plan, and `checkPhaseFit` reports it (Task 177 shows the text). | |
| 5 | Defaults | "+ Add phase" adds a Round robin (two-way), as the handoff. The phase before it gets Top 2 (Groups: Top 2 per group, best 0). | |
| 6 | Number fields | The `Input` primitive with `inputMode="numeric"`, a narrow width, and a visible label. | |

## Notes

- **2026-11-01:** Started. Facts from the code: the wizard has three steps (`LeagueSetupScreen.tsx`), and `useLeagueSetup` calls `createLeague` with no plans. `leagueDraftStore` holds the draft in memory, with no file. The MVP2 handoff (`League Setup Wizard`, step 2) has the phase cards, the format select, a group count field, "Top N advance", and the bracket settings (M4).
- **2026-11-01:** The user agreed the criteria and choices 1 to 6. Task 177 is on the board.
- **2026-11-01:** Claude choices found during the build: "Set by" resets the number to its default (size 4, count 2). The best M field reads "Best of place N + 1" with the real number, or "Best of the next place" while Top is not a number. `Input` gets an `inputMode` pass-through for choice 6. The wizard format chip now shows the phases (`formatPhasesLabel`): the full label of one phase, or the short names joined with " → ".
- **2026-11-01:** Look check: a temporary demo page in Vite, opened in headless Chromium. The cards, the fields, and the disabled "+ Add phase" with its hint show as in the handoff. The demo page is deleted.
- **2026-11-01:** The user agreed that the task is Done, and asked for a later layout polish: Task 178.

## Report

- **What was built:**
  - `LeagueSetupScreen/steps/PhasesStep/` (new), with `PhaseCard/`: the phase cards, the format field, "Set by" and the group number, Top N, best M, ↑ ↓ ✕, and "+ Add phase" with its bracket hint.
  - `LeagueSetupScreen/phasePlans.ts` (new): the pure edits of the plan list, the format keys, and the Review text. `usePhaseList.ts` (new): the plans and a stable key for each card.
  - `leagueSummary.ts`: `formatPhaseLabel`, `phaseShortName`, and `formatPhasesLabel`.
  - The wizard has four steps. The draft store keeps `plans`. "Create league" sends the plans, and stays off with a bracket phase. The Review step lists the phases.
  - `design-system` `Input`: an `inputMode` prop.
- **Test approach:** 43 new tests. The tests ran red first, but the 2 `Input` tests were written with the code.
  - `phasePlans.test.ts` (20): each edit, the bracket rules, the advancement rule, the number parse, the format keys, and the Review text.
  - `PhasesStep.test.tsx` (13, with a harness that holds the plans): the cards, add, remove, move, the Groups fields, Set by, the typed numbers and `NaN`, the bracket rules, the field values after a move, Back and Next.
  - `LeagueSetupScreen.test.tsx` (5 new): the step after Details, the create with the plans, the Review list and chip, the bracket reason, and the draft across a remount. The other wizard tests and the smoke test now walk through the Phases step.
  - `leagueSummary.test.ts` (3) and `Input.test.tsx` (2).
- **Decisions made:** choices 1 to 6, in the Decisions log (2026-11-01), and the Claude choices in the Notes.
- **What is left, what is next:** Task 177 adds the counts, the best M suggestion, and the warning texts. Until then, a plan that does not fit fails at "Create league" with the `createLeague` message in the status line. Task 130 adds the phase-1 groups to the Teams step.
