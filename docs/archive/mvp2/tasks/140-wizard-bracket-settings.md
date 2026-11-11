# Task 140: wizard bracket settings

**Status:** Done (2026-11-03)

## Goal

Let the user set up a Bracket phase in the wizard: the tie format, away goals, AET, the tiebreak method, the single-match final, and the third-place tie. The settings go into the plan `rules` (Task 139). The wizard also warns early when the bracket count is not a power of 2, and the Review step lists the settings.

Stories: US-03.1, US-03.2, US-04.1, US-04.3, US-04.12, US-04.13 (the wizard and Review rows), and US-04.9 (the power-of-2 warning).

## Acceptance criteria

### The Bracket card (Phases step)

- [x] A Bracket phase card shows, in this order: "Plays AET" (a switch, on by default), "Tiebreak method" (a segmented control: Penalties, Replay → Coin toss), and "Tie format" (a segmented control: Single match, Two-legged).
- [x] With Two-legged ties, the card also shows "Away goals rule" (off by default) and "Single-match final" (off by default). With Single match ties, it shows neither.
- [x] The card shows "Third-place playoff" (off by default). It is off and disabled when the bracket has fewer than 4 qualifiers, with the hint "Needs 4 qualifiers or more." (US-04.12 row 2, Task 137 choice 3).
- [x] A round-robin or Groups card shows none of these settings.
- [x] Each change writes the full `rules` of the plan. A plan with no `rules` shows the defaults (`bracketRulesOf`).
- [x] The settings stay in the wizard draft when the user goes to another screen and back, as the other phase fields do.

### The power-of-2 warning (US-04.9)

- [x] The Bracket card shows the warning when its qualifier count is known and is not a power of 2: "6 qualifiers: the bracket has 8 slots, so 2 teams get a bye."
- [x] The Teams step shows the same warning for a league with a Bracket phase, when the count is known.
- [x] The warning does not turn off Next or "Create league". Fewer than 2 qualifiers stays a fit problem (US-01.4).

### The Review step

- [x] A Bracket phase lists its settings: "Single match · AET on · Penalties", or "Two-legged · away goals off · AET on · Replay→Coin toss · Single-match final", and "· Third place" when it is on.

### Create league

- [x] "Create league" stays off for a league with a Bracket phase until Task 141, with the reason "The bracket screen comes in a later update." See choice 7.
- [x] Type check, lint, Prettier, and the full test suite pass.
- [x] The user checks the Phases step and the Review step in the real app.

## Out of scope

- The Bracket tab, the tie cards, and "Start phase" for a bracket (Task 141). Task 141 also turns on "Create league" for a bracket.
- The Bracket header line on League Detail (Task 141).

## Notes

- **2026-11-03:** Facts from the code.
  - `PhaseCard` (`steps/PhasesStep/PhaseCard/PhaseCard.tsx`) shows the format, the Groups fields, and the advancement. A Bracket card shows only its format.
  - `useLeagueSetup.ts` turns "Create league" off for any bracket, with "Bracket phases come in a later update.".
  - `phaseTeamCounts` (Task 177) gives the team count of each phase when the numbers are known, so the Bracket card knows its qualifier count.
  - `describePhasePlan` (`phasePlans.ts`) writes the Review text of each phase.
  - `SegmentedControl` (Task 138) and `Switch` exist in `design-system/`.
- **2026-11-03:** The handoff shows the "Plays AET" switch, then the two segmented controls, then the "Away goals rule" switch for two legs. It shows no single-match final and no third-place toggle. Those two are new in the stories.
- **2026-11-03:** Proposed choices, for the user to agree before the work starts:

  | # | Choice | Effect | Undo cost |
  |---|---|---|---|
  | 1 | Switches for the four on/off settings, and `SegmentedControl` for the tie format and the method. The handoff order, then "Single-match final", then "Third-place playoff". | The card looks like the handoff. | Low |
  | 2 | Each change writes the full `rules` object to the plan. | The plan always holds all six settings after the first change. | Low |
  | 3 | A switch to Single match keeps the away-goals and single-match-final values, hidden. A switch back to Two-legged shows them again. The engine ignores them for single-match ties. | No value is lost on a misclick. | Low |
  | 4 | The third-place toggle is off and disabled below 4 known qualifiers, with a hint. With no known count, it is enabled. | A plan can keep `thirdPlace` on when the count drops. The tree then has no third-place tie (Task 136). | Low |
  | 5 | The power-of-2 warning shows on the Bracket card and on the Teams step, when the count is known. It is a muted line, as the groups warning (Task 177 choice 4). | The user sees it on both steps, not only on one. The story asks for one place for each league shape. | Low |
  | 6 | The Review order: tie format, away goals (two legs only), AET, method, single-match final, third place. | Follows the handoff header line. | Low |
  | 7 ⚠ | "Create league" stays off for a bracket until Task 141, with a new reason text. | You can check the settings and the Review step, not a created bracket league. A league with no Bracket tab cannot happen. | Low |

- **2026-11-03:** The user agreed the criteria and choices 1 to 7.

- **2026-11-03:** `Switch` had no `disabled` prop, and choice 4 needs one. I added it (`design-system/components/Switch`), with two tests and a muted label. This is a small change to a primitive inside a feature task.
- **2026-11-03:** Test order. The helper tests and the Bracket card tests ran red first. The Teams step and Review test (`LeagueSetupScreen.test.tsx`) came after the code.
- **2026-11-03:** Look check by Claude: a temporary Vite demo of the Phases step with a Groups phase and a two-legged Bracket, in headless Chromium. The card shows the settings under a top rule, in the agreed order, and the warning "6 qualifiers: the bracket has 8 slots, so 2 teams get a bye.". The demo is deleted.
- **2026-11-03:** The user checked the real app and agreed that the task is Done.

## Report

- **What was built:**
  - `BracketSettings` in the Phases step: "Plays AET", "Tiebreak method", "Tie format", and for two legs "Away goals rule" and "Single-match final", then "Third-place playoff", disabled below 4 known qualifiers with a hint.
  - `setBracketRules` (`phasePlans.ts`) and the `PhaseList` action: each change writes the full `rules`.
  - `bracketQualifiers` and `bracketWarning` (`phaseChecks.ts`): the US-04.9 warning on the Bracket card and on the Teams step.
  - `describePhasePlan` lists the bracket settings in the Review step.
  - "Create league" stays off for a bracket, with "The bracket screen comes in a later update.".
  - `Switch` gets a `disabled` prop.
- **Test approach:** 24 new tests, 1617 tests in total: the rule edits, the Review text, the warning text, the card settings and their defaults, the hidden two-leg values, the disabled third place, the warning on the card and the Teams step, and the Switch `disabled` prop.
- **Decisions made:** choices 1 to 7 above, in the `PROGRESS.md` Decisions log on 2026-11-03. The `Switch` prop is in the notes.
- **What is left, what is next:**
  - The user checks the Phases step and the Review step in the real app.
  - Task 141 turns on "Create league" for a bracket and adds the Bracket tab.
