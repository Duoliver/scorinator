# Task 189: Zone editors: the wizard "Zones" section, "Edit zones" in League Detail

**Status:** Done

## Goal

A user can set the zones of each round-robin and Groups phase (US-12.5): in the wizard, before "Create league", and in League Detail, at any time. Task 155 gives the rules, the files, and the display. This task gives the two editors.

## Acceptance criteria

Proposed on 2026-11-10. The user agreed them on 2026-11-10.

**The editor (one component for both screens):**

- [x] The editor has one row for each colour: green, blue, yellow, red.
- [x] A free zone row has an on/off switch, a "From" place, a "To" place, and a label field of 24 characters at most.
- [x] An automatic zone row (green, and yellow with a best M, in a phase that is not the last) is always on. It shows its places as text, for example "Places 1–2 · from the advancement". Only its label can change.
- [x] Each `checkZones` problem shows under the editor as a text.

**The wizard:**

- [x] Each round-robin and Groups phase card of the Phases step has a "Zones" section.
- [x] A zone problem blocks "Create league", with its text, as a phase problem does.
- [x] "Create league" saves the zones in the plans.

**League Detail:**

- [x] Each round-robin and Groups phase tab has an "Edit zones" button, also on a locked phase and on a phase that has not started.
- [x] The button opens a drawer with the editor, "Save", and "Cancel". "Save" is off while the zones have a problem.
- [x] "Save" changes the plan zones, marks the league unsaved, and stamps it with the local installation (US-11.1). The standings show the new zones at once.
- [x] A new `setPhaseZones` action in `app/state`, with unit tests. Integration tests through the two screens.

**Out of scope:** more than four zones, custom colours, a link with promotion or relegation (MVP3), a check of a zone range against the team count.

## Notes

- **2026-11-10:** Facts from the code.
  - The handoff has no zone design.
  - `PhaseCard` holds the fields of one wizard phase. `usePhaseList` changes the plans. `phaseChecks` gives the problems that block "Create league".
  - League Detail puts a button for each phase in the sub-tab row (`actions`): "Start phase N" and "⟲ Shuffle groups". A phase that has not started shows one line only.
  - `changeCurrentPhase` in `leagueWrapperActions.ts` stamps the league. A plan change needs its own helper, because it can touch any phase.
- **2026-11-10:** Proposed choices, for the user to agree before the work starts:

  | # | Choice | Proposal | Flag |
  |---|---|---|---|
  | 1 | Where the editor lives | `features/leagues/ZoneEditor/`, beside `GroupCards`: two components of the `leagues` folder use it. | |
  | 2 | The editor shape | Four fixed rows, one for each colour, in place of an "Add zone" list. A row cannot repeat a colour. | |
  | 3 | What is stored | An automatic zone is stored only when its label is not the default. A free zone is stored only when it is on. So a later change of the advancement in the wizard keeps the default label correct. | |
  | 4 | A wizard chain change | When a format change or a move makes green or yellow automatic, its stored places and label go. When a phase becomes the last, its automatic zones go: the free zones start off. Blue and red stay. A Bracket phase drops all zones. | ⚠ The user loses a stored green or yellow zone. |
  | 5 | The wizard layout | The "Zones" section is under the advancement fields of the phase card, open, with no collapse. | Four rows make the card taller. |
  | 6 | "Edit zones" in League Detail | A button in the sub-tab row of each phase, beside "Start phase N" or "⟲ Shuffle groups". A phase that has not started shows the button under its line. The editor opens in a `Drawer`. | |
  | 7 | The places of a free zone | Two whole-number fields, with no check against the team count. A zone below the last place shows no row and no legend entry (Task 155 choice B). | |
- **2026-11-10:** The user agreed the seven choices and the criteria.
- **2026-11-10:** The user checked the real app and agreed that the task is done.

## Report

- **What was built:** `features/leagues/ZoneEditor/` gives four colour rows. An automatic row shows its places and changes only its label. A free row has a switch, "From", "To", and "Label". The wizard Phases step shows it in a "Zones" section on each round-robin and Groups card. A zone problem blocks "Create league". League Detail has "Edit zones" on each round-robin and Groups phase. The button opens `ZoneDrawer` with "Save" and "Cancel". "Save" calls the new `setPhaseZones` action. `fitZones` in `engine/phases` applies choice 4 to the wizard plan edits.
- **Test approach:** unit tests for `fitZones`, `getAutomaticZones`, the wizard plan edits, and `setPhaseZones`. The `ZoneEditor` tests mount the component. The `PhasesStep`, `LeagueSetupScreen`, and `LeagueDetailScreen` tests go through the real screens and the real store: a create with zones, a blocked create, a save, a cancel, Save off on a problem, a phase that has not started, and a locked phase. 1996 tests pass. Type check, lint, and Prettier are clean. Not checked yet: the look in the real app.
- **Decisions made:** the seven agreed choices, in the `PROGRESS.md` Decisions log. Two small ones in the code: the drawer title is "Zones" in a one-phase league and "Zones · Phase N" with phase tabs, and a Bracket phase tab has no empty button row.
- **What is left, what is next:** the Review step does not list the zones. The criteria did not ask for it.
