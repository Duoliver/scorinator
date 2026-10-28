# Task 093: refine epic 08, Team Selection in League Setup

**Status:** Done (2026-10-28)

## Goal

Turn the six spec stories of epic 08 into refined stories, with acceptance criteria, in `docs/user-stories/mvp2/08-team-selection.md`. Find the gaps in the spec and get an answer for each. Settle the pre-start state and the Start action, which US-01.4 left to this task. The build tasks (Task 84) start from these stories.

## Acceptance criteria

- [x] `docs/user-stories/mvp2/08-team-selection.md` has US-08.1 to US-08.6, one for each spec story, in the README template.
- [x] A new story gets the next free ID, only when a gap needs one. Candidate: the pre-start state and the Start action.
- [x] Each story has checkable criteria, an Out of scope line, and Notes that link to the spec and the decisions.
- [x] Each gap found has a user answer, or an entry in the `PROGRESS.md` Open questions.
- [x] The stories use the settled decisions: the OVR roll and the override rules (Task 81), the fit rule that blocks Start (US-01.4), the phase-1 group draw (US-02.1, US-02.5), the power-of-2 warning (US-04.9), and the Location label (US-09.3).
- [x] The stories follow the MVP2 handoff where it shows the screen, unless the user overrides it. Task 83 listed the handoff items for this task.
- [x] A spec edit happens only with the user's OK.
- [x] The user agrees each story, and its status becomes Agreed.

## Notes

- **2026-10-28:** Spec stories of epic 08 (`docs/scorinator-mvp2.md` §2): a searchable bulk-select dialog, "Load them all", a prompt to create a team when no Blueprints exist, Edit of the Instance, Switch, and Remove with a soft warning. Spec rules: §1 Team Selection in League Setup.
- **2026-10-28:** Settled inputs. An Instance gets its rolled OVR when its Blueprint is added (Select, Load them all, or Switch). Remove, then add again, rolls a new OVR. An override stays inside the Tier range. A Tier change rolls a new OVR at once (Task 81). A count that does not fit warns in setup and blocks Start (US-01.4). Phase-1 groups draw in the Teams step, with Shuffle and moves until Start. An added team goes to the smallest group. A Switch keeps the group (US-02.1, US-02.5). The single-bracket power-of-2 warning shows in the Teams step (US-04.9). The dialog rows show the Location, and the search matches it (US-09.3).
- **2026-10-28:** Handoff items from Task 83: the empty state has one action, "+ Add teams", with the text "Add teams from your saved blueprints, or create new ones on the fly." The add dialog lists "Available" Blueprints and can create a new team inline ("+ Create new team"). Row actions ✎ Edit, ⇄ Switch, ✕ Remove. Switch: "Pick a replacement from Available — this closes the dialog right away." The Edit drawer shows an "Original state" block, and the fields Team name, Slug, Colour, and Tier. The Review step button is "Create league".
- **2026-10-28:** Facts from the code. The MVP1 Teams step (`src/features/leagues/LeagueSetupScreen/steps/TeamsStep/`) lists every team with a checkbox, a search, "+ Create new team", and "Select all". The selection holds slugs, not Instances. "Create league" in the Review step makes the league and its fixtures at once (Task 14). A wizard draft store exists (`src/app/state/leagueDraftStore.ts`).
- **2026-10-28:** Gaps found. Each needs a user answer.
  1. The pre-start state and the Start action: what "Create league" does, and where the user starts the league.
  2. The empty state: the spec has "Select teams" and "Load them all". The handoff has one "+ Add teams".
  3. The Edit drawer: the spec edits the Instance only (OVR and Tier). The handoff drawer shows Blueprint fields (name, slug, colour).
- **2026-10-28:** The user agreed the criteria. The user asked what the post-creation "setup" is. Claude listed the sources: spec §1 Team Selection, impact review §2.4, US-01.2 (Task 83 D4), Task 76 (d), US-01.4, and US-02.1. None of them says that a Setup league stays saved after the wizard.
- **2026-10-28:** Gap 1 answer: setup is only the wizard. The handoff has no saved Setup league either. "Create league" makes the league and starts it: it builds phase 1. "Start" in US-01.4, US-02.1, US-02.5, and US-04.9 means this click. With the user's choice, Claude removed the "Setup" badge from US-01.2 and added a note to the Task 76 file. The MVP1 draft store keeps the wizard state in memory while the user goes to other screens.
- **2026-10-28:** Gap 2 answer: both "+ Add teams" and "Load them all". The user added a new story: import a plain text slug list in the Teams step, with an alert for missing slugs (US-08.7). The user also asked for a league export of a similar list, in position order. That export belongs to the File module (Task 95), which must settle the order for mixed formats.
- **2026-10-28:** Gap 3 answer: the Edit drawer edits the handoff fields (name, colour, Tier), plus the OVR, but on the Instance only. The Blueprint never changes. The slug stays the Blueprint slug.
- **2026-10-28:** With the gap 1 answer, Claude changed US-01.4: a count that does not fit disables "Create league", and the league is not created.
- **2026-10-28:** Claude wrote US-08.1 to US-08.8, with the status Refined. US-08.7 (slug list) and US-08.8 ("Create league" starts the league) are new.

- **2026-10-28:** The user agreed US-08.1 to US-08.8, the Claude choices, and the five spec edits. Status: Agreed. Claude edited `docs/scorinator-mvp2.md` §1 Team Selection in League Setup (setup is the wizard, the empty state, the slug list import, the Edit fields), §1 Teams Module (the Instance name and colour), and §2 (a story line for the import).

## Report

- **What was built:** `docs/user-stories/mvp2/08-team-selection.md`, with eight Agreed stories. US-08.1 to US-08.6 come from the spec. US-08.7 (slug list import) and US-08.8 ("Create league" starts the league) are new.
- **Test approach:** none, no code changed. The stories name the tests: the slug list parse in `adapters/txt` (US-08.7), the OVR range and the roll on a Tier change (US-08.4, Task 81), and the build of phase 1 for each format (US-08.8).
- **Decisions made:** the gap answers and the confirmed Claude choices in the Notes above, and in the `PROGRESS.md` Decisions log on 2026-10-28.
- **Spec edits:** five, in `docs/scorinator-mvp2.md` §1 and §2, with the user's OK. Each one is marked with its date and Task 93.
- **Other stories changed:** US-01.2 lost the "Setup" badge. US-01.4: a count that does not fit disables "Create league". The Task 76 file has a note: the progress is never "setup".
- **Effect on other tasks:**
  - **Task 94 (Teams Module):** the Instance holds a name, a colour, a Tier, and an OVR, copied at add. A Blueprint edit changes no Instance. US-09.3 keeps the Location on the Blueprint only.
  - **Task 95 (File Module):** add the league slug list export, in position order. Settle the order for mixed formats there. The per-league export embeds the Instance name and colour.
  - **Engine:** `engine/tier-ovr` needs the range check for the OVR override (Task 81).
- **What is left, what is next:** nothing. Next is Task 94, Teams Module (Blueprints).
