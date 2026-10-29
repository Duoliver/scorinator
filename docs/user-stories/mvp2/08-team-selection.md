# Epic 08: Team Selection in League Setup

Refined in [Task 93](/docs/tasks/093-refine-team-selection.md). Source: [`docs/scorinator-mvp2.md`](/docs/scorinator-mvp2.md) §1 Team Selection in League Setup, §2 Epic: Team Selection in League Setup. Layout reference: the MVP2 handoff, `Footballer - League Setup Wizard` (Teams step, the add dialog, and the Edit drawer).

**Terms used in this file:**

- **Wizard:** the League Setup wizard: Details → Phases → Teams → Review (US-01.1). Setup is only the wizard. No league exists before "Create league" (US-08.8).
- **Team list:** the teams of the new league, on the Teams step. Each row is one Instance.
- **Available Blueprint:** a Blueprint with no Instance in the team list. In MVP2 every Blueprint is eligible: a league has no location scope.

---

### US-08.1: add teams from a searchable dialog

**Status:** Agreed
**Spec:** `docs/scorinator-mvp2.md` §1 Team Selection in League Setup, §2 Team Selection

As a user, I want to bulk-select teams for a new league from a searchable checklist (colour, name, tier shown per row), so that I can build a roster quickly.

**Acceptance criteria:**

- [ ] The Teams step has a "+ Add teams" button. It opens the "Add teams" dialog, as in the handoff.
- [ ] The dialog lists each available Blueprint: the colour swatch, the name, the Location in muted text (US-09.3), and the Tier. A click on a row moves it to the selected teams, as in the handoff. The rows have no checkbox (Task 113).
- [ ] A search field filters the list by name or Location. The search ignores case.
- [ ] The user can select many Blueprints. The dialog shows the selected teams, each with a ✕ to take it out of the selection.
- [ ] The dialog has "+ Create new team". It opens the team drawer. A saved team becomes a new Blueprint in the Teams module, and the dialog selects it.
- [ ] The confirm button says the count, for example "Add 4 teams". It is disabled with no selection. "Cancel" adds nothing.
- [ ] The confirm adds one Instance for each selected Blueprint, in the order of selection. Each Instance gets a rolled OVR from its Tier (Task 81).
- [ ] With a phase-1 Groups phase, each added team goes into the smallest group (US-02.1).
- [ ] The team list shows each Instance: the colour swatch, the name, the Location in muted text, the Tier, the OVR, and the actions ✎ Edit, ⇄ Switch, ✕ Remove.
- [ ] The team list shows the count, for example "12 teams".

**Out of scope:** a location filter (MVP3). The group columns and moves (US-02.5).

**Notes:** the dialog layout, the inline create, and the row actions follow the handoff (Task 83). The order of selection is a Claude choice. The user confirmed it on 2026-10-28. It matters because a round robin pairs teams by their order (US-06.1).

---

### US-08.2: load them all

**Status:** Agreed
**Spec:** `docs/scorinator-mvp2.md` §1 Team Selection in League Setup, §2 Team Selection

As a user, I want a "Load them all" shortcut that adds every eligible team at once, so that I don't have to check boxes one by one when I want everyone.

**Acceptance criteria:**

- [ ] The Teams step has a "Load them all" button beside "+ Add teams", in the empty state and after teams are added.
- [ ] One click adds an Instance for each available Blueprint, in the order of the Teams module list. Each Instance gets a rolled OVR (Task 81).
- [ ] The button adds only Blueprints that are not in the team list. The teams already in the list keep their Instances.
- [ ] The button is disabled when no Blueprint is available.
- [ ] With a phase-1 Groups phase, each added team goes into the smallest group (US-02.1).

**Out of scope:** the location eligibility filter (MVP3).

**Notes:** the user chose to keep the spec shortcut beside the handoff "+ Add teams" on 2026-10-28 (Task 93 gap 2).

---

### US-08.3: create the first team from the empty state

**Status:** Agreed
**Spec:** `docs/scorinator-mvp2.md` §1 Team Selection in League Setup, §2 Team Selection

As a user, when I have no teams created yet, I want to be prompted to create one instead of seeing options that would do nothing, so that the empty state actually helps me.

**Acceptance criteria:**

- [ ] With no Blueprints in the Teams module, the Teams step shows "No teams yet. Create your first team." and one button, "+ Create new team".
- [ ] The button opens the team drawer. A saved team becomes a Blueprint, and the team list gets its Instance, with a rolled OVR.
- [ ] With Blueprints, but an empty team list, the Teams step shows the handoff empty state: "No teams added yet", the text "Add teams from your saved blueprints, or create new ones on the fly.", and the buttons "+ Add teams", "Load them all", and "Import slug list" (US-08.7).

**Out of scope:** none.

**Notes:** the text with no Blueprints is a Claude choice. The user confirmed it on 2026-10-28.

---

### US-08.4: edit a team for this league only

**Status:** Agreed
**Spec:** `docs/scorinator-mvp2.md` §1 Team Selection in League Setup, Teams Module (Blueprints), §2 Team Selection

As a user, I want to Edit a team's Instance in this league (not its global Blueprint) directly from the league's team list, so that per-league tweaks do not change the Blueprint or any other league.

**Acceptance criteria:**

- [ ] ✎ Edit opens the team drawer, as in the handoff, with the title "Edit team for this league".
- [ ] The drawer has an "Original state" block, read only: the Blueprint name, colour, slug, base Tier, and Location.
- [ ] The editable fields: "Team name", "Colour", "Tier", and "OVR".
- [ ] The slug shows read only. It is the slug that the Instance copied from the Blueprint at add, also after a name change (US-09.2).
- [ ] The OVR must stay inside the Tier range, for example 60 to 69 for Tier C. The field shows the range (Task 81).
- [ ] A Tier change rolls a new OVR from the new Tier at once. The user can then change it inside the new range (Task 81).
- [ ] "Save" writes the changes to the Instance only. The Blueprint and every other league stay the same.
- [ ] Two teams of one league cannot have the same name. The drawer shows the reason and disables "Save".
- [ ] "Reset to original" puts back the Blueprint name, colour, and Tier, and rolls a new OVR.
- [ ] An Instance gets a copy of the Blueprint name, colour, and Tier when it is added, as it gets its Tier today (Task 81). A later Blueprint edit does not change the Instance.
- [ ] Each league screen shows the Instance name and colour: the team list, the group columns, the Review step, the standings, the fixtures, the tie cards, and the results `.txt` export.
- [ ] The Location is not an Instance field. Screens read it from the Blueprint (US-09.3).

**Out of scope:** an edit after "Create league": post-setup roster editing is parked (`scorinator-future-features.md` §1). An edit of the Blueprint from the wizard.

**Notes:** the user chose the handoff fields on 2026-10-28 (Task 93 gap 3), with the rule that the Blueprint never changes, and the slug stays the Blueprint slug. The spec has the Instance name and colour since 2026-10-28, with the user's OK. The drawer title, the unique name rule, "Reset to original", and the copy at add are Claude choices. The user confirmed them on 2026-10-28.

---

### US-08.5: switch a team

**Status:** Agreed
**Spec:** `docs/scorinator-mvp2.md` §1 Team Selection in League Setup, §2 Team Selection

As a user, I want to Switch a team for a different one via the same picker, pre-filtered to exclude teams already in the league, so that swapping is quick and duplicate-safe.

**Acceptance criteria:**

- [ ] ⇄ Switch opens the "Add teams" dialog in single-select mode, with the text "Pick a replacement from Available — this closes the dialog right away.", as in the handoff.
- [ ] The dialog lists only available Blueprints. The search works as in US-08.1.
- [ ] One click on a Blueprint replaces the row at once and closes the dialog.
- [ ] The new Instance gets a rolled OVR (Task 81). The edits of the old Instance are lost.
- [ ] The new team takes the place of the old one in the team list, and in its group (US-02.1).
- [ ] "+ Create new team" works in Switch mode too. The new Blueprint replaces the row.

**Out of scope:** none.

**Notes:** none.

---

### US-08.6: remove a team

**Status:** Agreed
**Spec:** `docs/scorinator-mvp2.md` §1 Team Selection in League Setup, §2 Team Selection

As a user, I want to Remove a team from the roster, with a warning (not a hard block) if that drops below the format's minimum, so that I know the league isn't ready to start without being stopped outright.

**Acceptance criteria:**

- [ ] ✕ Remove takes the Instance out of the team list at once, with no confirm.
- [ ] The team leaves its group. The other groups stay (US-02.1).
- [ ] Remove, then add again, gives a new Instance with a new rolled OVR (Task 81).
- [ ] When the team count no longer fits (US-01.4), the Teams step shows the warning, for example "The league needs at least 2 teams to start."
- [ ] The warning does not block Remove, Next, or Back. It disables "Create league" (US-08.8).

**Out of scope:** the fit rules (US-01.4).

**Notes:** no confirm on Remove is a Claude choice. The user confirmed it on 2026-10-28. A remove loses only what the user set in the wizard.

---

### US-08.7: pick teams from a slug list file

**Status:** Agreed
**Spec:** `docs/scorinator-mvp2.md` §1 Team Selection in League Setup, §2 Team Selection. A new story. The spec has it since 2026-10-28 (Task 93), with the user's OK.

As a user, I want to load a plain text file of team slugs into the Teams step, so that I can set up a known roster fast.

**Acceptance criteria:**

- [ ] The Teams step has an "Import slug list" button, in the empty state and in the toolbar. It opens a file dialog for `.txt` files.
- [ ] The file has one slug on each line. The app trims each line, and ignores blank lines and lines that start with `#`.
- [ ] The match with a Blueprint slug ignores case.
- [ ] Each found slug that is not in the team list adds an Instance, with a rolled OVR (Task 81), in file order.
- [ ] A slug already in the team list, or a second copy of a slug in the file, adds nothing.
- [ ] With a phase-1 Groups phase, each added team goes into the smallest group (US-02.1).
- [ ] After the import, a message gives the counts, for example "8 teams added. 2 already in the list."
- [ ] When slugs are not found, an alert lists them, for example "3 slugs not found: north-fc, rivertown, ashby-utd". The found teams are still added.
- [ ] A file with no valid slug adds nothing and shows an error message.
- [ ] The parse is a pure function in `adapters/txt`, with tests. The file read goes through the app data layer.

**Out of scope:** the league slug list export, in position order: a File module item for Task 95, which must also settle the order for mixed formats. Create a missing team from the alert.

**Notes:** new story. The user asked for it on 2026-10-28 (Task 93 gap 2). The file rules, the "add the found teams" rule, and the message texts are Claude choices. The user confirmed them on 2026-10-28.

---

### US-08.8: "Create league" starts the league

**Status:** Agreed
**Spec:** `docs/scorinator-mvp2.md` §1 Team Selection in League Setup. A new story. The spec has it since 2026-10-28 (Task 93), with the user's OK.

As a user, I want "Create league" to make the league and start it in one step, so that setup stays inside the wizard.

**Acceptance criteria:**

- [ ] The Review step has one main button, "Create league", as in the handoff.
- [ ] "Create league" is disabled while a count does not fit (US-01.4) or a group has fewer than 2 teams (US-02.1). It shows the reason.
- [ ] A warning that does not block, for example the Groups-last warning (US-01.5) or the power-of-2 warning (US-04.9), does not disable it.
- [ ] One click makes the league with its Instances, and builds phase 1: the round-robin schedule, the stored group draw, or the bracket seeds and byes. The fixtures get their ids (Task 77).
- [ ] The app opens League Detail of the new league, and clears the wizard state.
- [ ] No league exists in a Setup state. The dashboard shows only started leagues (US-01.2).
- [ ] The wizard state stays in memory while the user goes to other screens, as in MVP1. It is not saved to the database.

**Out of scope:** a saved draft league. Post-setup roster editing (`scorinator-future-features.md` §1).

**Notes:** new story, from Task 93 gap 1. The user chose "setup is only the wizard" on 2026-10-28. The handoff has no saved setup league. "Start" in US-01.4, US-02.1, US-02.5, and US-04.9 means this click.
