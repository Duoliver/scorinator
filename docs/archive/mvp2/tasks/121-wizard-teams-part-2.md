# Task 121: Wizard Teams step, part 2: Switch, the live trigram pick, "Create league"

**Status:** Done

## Goal

The user can switch a team, and sees the trigram that each team gets. "Create league" stores the trigrams, and refuses a team list that cannot start. Choice 1 moved ✎ Edit for this league to Task 172.

## Acceptance criteria

The user agreed these criteria and the ten choices on 2026-10-30. Choice 1 moved Part B to Task 172, with choices 8, 9, and 10.

**Switch, the trigram pick, and "Create league" (US-08.5, US-08.6, US-08.8, US-09.6):**

- [x] ⇄ Switch on a row opens the "Add teams" dialog in single mode, with the text of the handoff. It lists only available Blueprints, with the search.
- [x] One click replaces the row at once, in the same place, and closes the dialog. The new Instance gets a rolled OVR. The edits and the fixed trigram of the old one are lost.
- [x] "+ Create new team" in Switch mode makes a Blueprint, and it replaces the row.
- [x] Each row shows the trigram that the team gets, in `--font-mono`. The pick runs again after each add, Switch, Remove, or Edit: Tier first, then the higher OVR, then the lot (choice 3).
- [x] A row with the digit fallback shows the hint "No free trigram. Add an alternative to the team."
- [x] With 1 team, the Teams step shows "The league needs at least 2 teams to start." It does not block Remove, Next, or Back.
- [x] On the Review step, "Create league" is disabled while the list cannot start, and shows the reason: fewer than 2 teams, or two teams with the same name (choice 6).
- [x] "Create league" stores the picked trigram on each Instance. After that, it does not change.
- [x] The league file reads and writes the Instance trigram. A league file with no trigram on an Instance still opens (choice 4).

**Code:**

- [x] Unit tests for the new `app/` rules. Integration tests with Testing Library for the Teams step, the Review step, and the wizard.
- [x] `npm run lint`, `npm run format:check`, `npm run type-check`, and `npm test` pass.

**Out of scope:** ✎ Edit for this league (Task 172). Groups: the group of a switched or removed team, and the group fit rules (M3, Task 130). The phase fit rules (Task 126). The trigrams on the league screens (Task 157).

## Notes

- **2026-10-30:** Facts from the code and the specs. `TeamInstance` has no trigram field. `pickTrigrams` (Task 115) takes a lot for each team from the caller. The Task 78 lots need a league UUID, which does not exist before "Create league", and Task 124 builds them. `PickerDialog` has a single mode with "Currently in slot" (Task 113). `isOvrInTier` and `ovrAfterTierChange` exist (Task 116). `TeamForm` is the Blueprint form: the Instance drawer has other fields (OVR, trigram, Original state, Reset). The wizard has no Phases step before M3, so the only fit rule is 2 teams for a round robin. Task 120 disables Next with an empty list.
- **2026-10-30:** The user agreed the criteria and choices 1 to 10, and asked if the Edit drawer can share logic with `TeamForm`. It can: the name, colour, and Tier fields, the field error line, the name check, and the options. Choice 10 now says so. Part B is Task 172, with choices 8, 9, and 10.

## Choices for discussion

| # | Choice | Effect | Undo cost |
|---|---|---|---|
| ⚠ 1 | Split: Part A stays Task 121. Part B, the Edit drawer, becomes new Task 172. | Two reviews of about 2 hours of work each. | Low |
| 2 | The fixed trigrams live in the draft as a map from Blueprint UUID to trigram, beside the team list. | No second meaning for an Instance field during the setup. | Low |
| ⚠ 3 | The lot of a team is its place in the list: the team added first picks first, on a full tie. The Task 78 hash waits for Task 124. | The pick is easy to predict, and needs no league UUID. The stored trigrams never change later. | Low |
| ⚠ 4 | `TeamInstance` gets `trigram: string`. A league file with no trigram reads it as `''`, and a screen then uses the trigram made from the name (Task 157). The format version stays 2. | The M1 and M2 leagues on disk still open. | Medium |
| 5 | The Switch dialog: title "Switch team", with the replaced team under "Currently in slot". | The handoff has one dialog for both modes. | Low |
| ⚠ 6 | Two teams with the same name, from two Blueprints with the same name, block "Create league" with "Two teams have the name Ashfield. Edit one of them." | US-08.4 says that two teams of one league cannot have the same name. An add does not stop it. | Low |
| 7 | Next stays disabled with an empty list, as in Task 120. With 1 team, Next works, and the warning shows. | The warning does not block Next, as US-08.6 says. | Low |
| 8 | A fixed trigram must differ only from the other fixed trigrams. The pick moves the other teams. | The user can take a code that another team got from the pick. | Low |
| 9 | "Reset to original" also clears the fixed trigram. | The team goes back to the pick, as a new add. | Low |
| 10 | The Edit drawer is a new component in `TeamsStep/`. It reuses parts of `TeamForm`: the name, colour, and Tier fields as one shared block, the field error line, the name check, and the colour and Tier options. Changed by the user on 2026-10-30. | `TeamForm` stays the Blueprint form, and the two forms share their common fields. | Low |

## Report

- **What was built:**
  - `TeamInstance` gets `trigram`. The league file reads and writes it: a file with no trigram reads it as `''`, and a trigram that is not text is an error.
  - `app/state/teamInstances.ts`: `pickTeamTrigrams(list, blueprints, fixed)` runs the Task 115 pick with the list place as the lot. `teamListProblem(list)` gives "The league needs at least 2 teams to start." or "Two teams have the name X. Edit one of them.", or `null`.
  - `createLeague` takes `fixedTrigrams`, and stores the picked trigram on each Instance.
  - The draft holds `fixedTrigrams`. `useTeamList` gets `switchTeam`, and a Remove or a Switch drops the fixed trigram of the team.
  - The Teams step: a Trigram column in the mono font, with ⚠ and the hint for a digit fallback. ⇄ Switch opens the "Switch team" dialog, also with "+ Create new team". A warning under the list shows the problem of the list. The Review step disables "Create league" and shows the reason above it.
- **Test approach:** 18 new tests, and the wizard tests now add 2 teams. Unit tests: the trigram read, an empty and a bad trigram, the pick (OVR, list place, fixed, deleted Blueprint), the list problem (count, names with no regard to case), and the stored trigrams of `createLeague`. Integration tests with Testing Library: the Trigram column, the fallback hint, Switch (slot, available list, place, OVR, a new team in the dialog), the warning with 1 and 2 teams, and "Create league" off with 1 team. WebKit screenshots outside the project show the list, the hint, the Switch dialog, and the Review reason. Full suite: 933 tests pass. Lint, format check, type check, and `npm run build` pass.
- **Decisions made:** choices 1 to 7, agreed by the user. Choices 8 to 10 belong to Task 172. Claude choices: the warning under the list shows any list problem, also two teams with the same name. The ⚠ and the reasons use `--color-error`. The Review footer aligns to the bottom, so "Back" keeps its height next to the reason.
- **What is left, what is next:** Task 172 adds ✎ Edit with the fixed trigram. With every Blueprint in the list, the Switch dialog shows an empty "Available" list with no text. The ⇄ glyph needs a look in the real app: the headless browser draws it with a fallback font.
