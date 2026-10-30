# Task 120: Wizard Teams step, part 1: the add dialog, Load them all, empty states, Import slug list

**Status:** Done

## Goal

Replace the MVP1 checkbox list of the wizard Teams step with the MVP2 team list: each row is an Instance, with an OVR rolled at the add. The user adds teams from the "Add teams" dialog, with "Load them all", or from a slug list file. Task 121 then adds Edit, Switch, the trigram pick, and the "Create league" rules.

## Acceptance criteria

The user agreed these criteria and the ten choices below on 2026-10-30, with one change: the list has no OVR column.

**The team list (US-08.1):**

- [x] The draft holds the team list as Instances: name, colour, slug, Tier, OVR, and the Blueprint UUID. It survives a step change and a screen change, as the draft does today.
- [x] Each row shows the colour swatch, the name, the Location in muted text (from the Blueprint), and the Tier. It shows no OVR (changed by the user). The list shows the count, for example "12 teams".
- [x] Each row has ✕ Remove (choice 2). The Instance leaves the list, and the Blueprint is available again.
- [x] "Create league" stores the Instances of the list, with their OVR. It rolls nothing more (choice 1).

**The add dialog (US-08.1):**

- [x] "+ Add teams" opens the "Add teams" dialog. It lists each available Blueprint: swatch, name, Location in muted text, and Tier. A click moves a row to the selected teams.
- [x] The search matches the name or the Location, with no regard to case.
- [x] "+ Create new team" in the dialog opens the team drawer. The saved team becomes a Blueprint, and the dialog selects it.
- [x] The confirm says the count, "Add 4 teams" or "Add 1 team". It is disabled with no selection. "Cancel" adds nothing.
- [x] The confirm adds one Instance for each selected Blueprint, in the order of selection, each with an OVR rolled from its Tier (Task 81).

**Load them all (US-08.2):**

- [x] "Load them all" sits beside "+ Add teams", in the empty state and above the list.
- [x] It adds an Instance for each available Blueprint, in the order of the Teams module list, with rolled OVRs. The teams in the list keep their Instances.
- [x] It is disabled when no Blueprint is available.

**The empty states (US-08.3):**

- [x] With no Blueprints: "No teams yet. Create your first team." and one button, "+ Create new team". The saved team becomes a Blueprint, and the list gets its Instance.
- [x] With Blueprints and an empty list: "No teams added yet", the text "Add teams from your saved blueprints, or create new ones on the fly.", and "+ Add teams", "Load them all", and "Import slug list".

**Import slug list (US-08.7):**

- [x] "Import slug list" sits in the empty state and above the list. It opens a file dialog for `.txt` files, through `app/data`.
- [x] The file goes through `parseSlugList` (Task 118). The match with a Blueprint slug ignores case.
- [x] Each found slug that is not in the list adds an Instance, with a rolled OVR, in file order. A slug in the list, or a second copy in the file, adds nothing.
- [x] A message gives the counts, for example "8 teams added. 2 already in the list."
- [x] When slugs are not found, a notice lists them, for example "3 slugs not found: north-fc, rivertown, ashby-utd". The found teams are still added.
- [x] A file with no slug adds nothing, and shows "The file has no slugs." A bad line shows the Task 118 error. Both use the status line.

**The Review step:**

- [x] The Review step lists the Instances of the list, with the Location in muted text (US-09.3).

**Code:**

- [x] Unit tests for the new `app/` actions and the slug list match. Integration tests with Testing Library for the Teams step and the wizard.
- [x] `npm run lint`, `npm run format:check`, `npm run type-check`, and `npm test` pass.

**Out of scope:** ✎ Edit and ⇄ Switch (Task 121). The live trigram pick, and the "Create league" fit rules (Task 121). The smallest group rule for a Groups phase (choice 8). The picker row look (Task 165).

## Notes

- **2026-10-30:** Facts from the code and the specs. The Teams step is the MVP1 list: a search field, a checkbox for each Blueprint, "Select all", and "+ Create new team". The draft holds `selectedSlugs`, and `createLeague` takes Blueprint UUIDs and rolls the OVR at create (Task 160 choice: the roll moves later). `PickerDialog` (Task 113) has the multi mode, the search, the "Selected (N)" panel, an available action, and a confirm that it disables with no selection. `parseSlugList` (Task 118) gives the slugs or throws a line error. The wizard has no Phases step yet: Groups come in M3 (Tasks 125, 130). The MVP2 handoff list rows show the name, the Tier, and ✎ ⇄ ✕.
- **2026-10-30:** The user asked if the OVR can roll at "Create league". Task 81 (2026-10-27) chose the roll at the add, and Task 160 kept the roll at create for M1 only. The user kept the roll at the add, because the live trigram pick needs the OVR. The user dropped the OVR column from the team list. US-08.1 says so now.

- **2026-10-30 (review):** On a small window, the empty state buttons moved to the left: the empty state centered the button row, but the row did not center its buttons when it wrapped. The row now sets `justify-content: center` in the empty state. At the user's request, a new rule in `docs/coding-standards.md`: a container that its parent centers also centers its own children. Checked in WebKit at 520 px wide: both button rows center at the middle of the empty state. No other centered column in the app has the fault.

- **2026-10-30 (review):** The user asked for the name above the Location in each list row, with a smaller Location, and the name block as `flex: 1`, so the Tier sits at the row end. New shared component `steps/TeamLabel`, used by the Teams step list, the add dialog rows, and the Review step. The Location goes from `--font-size-md` to `--font-size-sm`. The add dialog rows fill their button or their "Selected" row. The "Selected" ✕ was off the middle: the browser button padding pushed the glyph right. `PickerDialog` now sets `padding: 0` and a centered flex box on it. Measured in WebKit: the glyph center is 878.99 px, the box center 879 px.

- **2026-10-30 (review):** The user asked to cut the vertical padding of the add dialog rows to half. The rows used `--space-3` (12 px). Half is 6 px, and no token holds it, so the tie rounds up to `--space-2` (8 px), by the `DESIGN_SYSTEM.md` rule. The padding is now `var(--space-2) var(--space-3)`, in `PickerDialog.module.css`, for the "Available" and the "Selected" rows.

- **2026-10-30 (review):** The user asked for the name and the Location on one line in the Review list, with a `1ch` gap. `TeamLabel` gets the option `inline`, off by default: a row on the text baseline, with `gap: 1ch`. The Review list turns it on. The other lists keep the name above the Location. `1ch` is not a spacing token: it is one character wide, the space between two words, as the user asked.

## Choices for discussion

| # | Choice | Effect | Undo cost |
|---|---|---|---|
| ⚠ 1 | The OVR roll moves to the add now, not in Task 121. The draft holds Instances, and `createLeague` takes them. | The live trigram pick (Task 121) and the Edit OVR field (US-08.4) need the OVR before "Create league". The list shows no OVR. | Medium |
| ⚠ 2 | ✕ Remove comes in this task, not in Task 121. ✎ and ⇄ stay in Task 121. | The checkbox list goes away, so without Remove a wrong pick stays in the list. | Low |
| 3 | The search field leaves the Teams step. The add dialog has the search. | As in the handoff. | Low |
| 4 | The "not found" notice is a box in the Teams step, with `role="alert"` and a ✕. No new dialog primitive. | It stays in view next to the list until the user closes it. | Low |
| 5 | A second copy of a slug in the file counts as "already in the list". | One count for every line that adds nothing. | Low |
| 6 | The texts: "1 team added." and "8 teams added.", plus " 2 already in the list." only when the count is not 0. "1 slug not found: …" for one. | The singular reads right. | Low |
| 7 | The add dialog: title "Add teams", text "Pick teams from your saved blueprints." | The handoff gives no text. | Low |
| 8 | The smallest group rule waits for Task 130. No Groups phase exists before M3. | No group code in M2. | Low |
| 9 | The Review step reads the Instances, and shows the Location in muted text (US-09.3). | The Review list matches the Teams step. | Low |
| 10 | The counts message and the file errors use the status line, as the team imports do. | One place for the file messages. | Low |

## Report

- **What was built:**
  - `app/state/teamInstances.ts`: `newTeamInstances(blueprints, rng)` makes Instances with an OVR rolled at the add. `planSlugListImport(slugs, blueprints, list)` matches a slug list with no regard to case, and gives the teams to add, the count already in the list, and the slugs not found.
  - `app/data/slugListTxt.ts`: `importSlugListTxt()` opens a `.txt` file and runs `parseSlugList`.
  - `app/random.ts`: `freshSeed()` moves here, with a new `freshRng()`.
  - `createLeague` takes the Instances of the team list, and rolls nothing. It throws for a Blueprint UUID twice in the list.
  - The draft holds `teams: TeamInstance[]` in place of `selectedSlugs`. `useTeamList` replaces `useTeamSelection`.
  - The Teams step: the two empty states, the three add buttons, the list with ✕ Remove, the count, the add dialog with "+ Create new team", and the "not found" notice. The Review step lists the Instances, with the Location. `useBlueprintLocation` gives the Location of an Instance from its Blueprint.
- **Test approach:** 34 new or rewritten tests. Unit tests: the Instances (fields, OVR range, order, seed), the slug list match (case, order, already in the list, a second copy, not found, a regenerated slug), `createLeague` with Instances, and the `.txt` file read. Integration tests with Testing Library: the Teams step through a harness with the real `useTeamList` (empty states, list, Remove, dialog, search, create in the dialog, Load them all, the slug list counts, notice, errors, Cancel), the Review Location, and the wizard (the draft keeps the list and the OVRs, and the league gets the same Instances). The smoke test uses "Load them all". The step tests failed first only because the hook did not exist. I wrote the `.txt` file read test with its code. I took WebKit screenshots of the empty state, the dialog, and the list, outside the project. Full suite: 913 tests pass. Lint, format check, type check, and `npm run build` pass.
- **Decisions made:** choices 1 to 10, agreed by the user. The user dropped the OVR column (US-08.1 changed). Claude choices: the three add buttons use the `sm` size. ✕ Remove is a plain icon button with the `aria-label` "Remove Ashfield Rovers". The notice has a yellow border (`--color-warning`). With no selection, the dialog confirm says "Add teams".
- **What is left, what is next:** Task 121 adds ✎ Edit, ⇄ Switch, the live trigram pick, and the "Create league" rules. Task 165 can fix the search placeholder: it says "Search by name…" but also matches the Location. The Tier place and the ✕ center are fixed in this task, at review.
