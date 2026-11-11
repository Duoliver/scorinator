# Task 096: refine epic 11, Identity & Provenance

**Status:** Done (2026-10-28)

## Goal

Turn the two spec stories of epic 11 into refined stories, with acceptance criteria, in `docs/user-stories/mvp2/11-identity-provenance.md`. Find the gaps in the spec and get an answer for each. This is the last refinement task. The build tasks (Task 84) start from these stories.

## Acceptance criteria

- [x] `docs/user-stories/mvp2/11-identity-provenance.md` has US-11.1 and US-11.2, one for each spec story, in the README template.
- [x] A new story gets the next free ID, only when a gap needs one.
- [x] Each story has checkable criteria, an Out of scope line, and Notes that link to the spec and the decisions.
- [x] Each gap found has a user answer, or an entry in the `PROGRESS.md` Open questions.
- [x] The stories use the settled decisions: CSV matches by slug, not by UUID (Task 75), the database and its manifest (Task 76), the Instance keeps the UUID of a deleted Blueprint (US-09.2, US-09.4), the import picker and the silent keep of a known embedded Blueprint (US-10.3), and the injected UUID source and clock (`ENGINE.md`).
- [x] The stories follow the MVP2 handoff where it shows the screen, unless the user overrides it.
- [x] A spec edit happens only with the user's OK.
- [x] The user agrees each story, and its status becomes Agreed.

## Notes

- **2026-10-28:** Spec stories of epic 11 (`docs/scorinator-mvp2.md` §2): an entity keeps the same identity across any number of exports and imports, and an import conflict asks Skip or Import as new. Spec rules (§1 Identity & Provenance): a permanent UUID v4 at creation. An installation UUID for `created_by_installation` and `last_modified_by_installation` only. An unknown UUID imports as it is. A known UUID never overwrites the local entity: the user picks Skip, or Import as new with a fresh UUID.
- **2026-10-28:** Settled inputs. CSV is the one import that matches by slug (Task 75). The database lives in the app data folder (Task 76). An Instance keeps the UUID of its Blueprint, also after a delete (US-09.2, US-09.4). A league import keeps a known embedded Blueprint with no prompt, and adds an unknown one (US-10.3). `engine/identity` takes the UUID source and the clock by injection (`ENGINE.md`). League Detail routes move from the slug to the UUID (impact review §2.1).
- **2026-10-28:** The handoff (`File Manager`) shows a "Resolve conflicts" dialog: "These already exist locally by UUID. Skip keeps your local version untouched; Import as new forks the incoming one with a fresh UUID." One row for each conflict, with its name, its UUID, and the choice Skip or Import as new. Buttons "Cancel" and "Confirm".
- **2026-10-28:** Facts from the code. `engine/identity` has only `slug()`. No entity has a UUID in MVP1 (impact review §2.1).
- **2026-10-28:** Gaps found. Each needs a user answer.
  1. An incoming entity with a known UUID and the same content as the local one: does it still show as a conflict?
  2. Does the "Resolve conflicts" dialog have buttons that set every row at once?
  3. Does the app show the provenance (the installation fields) anywhere?
- **2026-10-28:** The user agreed the criteria. Gap answers: (1) the same content skips silently, with a count in the import message. (2) "Skip all" and "Import all as new" buttons in the dialog. (3) The provenance is not shown.
- **2026-10-28:** Claude wrote US-11.1 and US-11.2, with the status Refined.

- **2026-10-28:** The user agreed US-11.1, US-11.2, the Claude choices, and two spec edits. Status: Agreed. Claude added two bullets to `docs/scorinator-mvp2.md` §1 Identity & Provenance System.

## Report

- **What was built:** `docs/user-stories/mvp2/11-identity-provenance.md`, with two Agreed stories, US-11.1 and US-11.2, one for each spec story.
- **Test approach:** none, no code changed. The stories name the tests: a UUID round trip, a fixed UUID source, and each import path of US-11.2.
- **Decisions made:** the gap answers and the confirmed Claude choices in the Notes above, and in the `PROGRESS.md` Decisions log on 2026-10-28.
- **Spec edits:** two bullets in `docs/scorinator-mvp2.md` §1, with the user's OK, each marked with its date and Task 96.
- **Effect on other tasks:**
  - **Task 84 (build tasks):** all refinement tasks are done. Task 84 can start. The identity work comes early, because every other MVP2 entity needs a UUID.
  - **Engine:** `engine/identity` gets a UUID function with an injected source, beside `slug()`.
  - **Design system:** the conflict dialog uses the confirm modal pattern, with a segmented choice on each row.
- **What is left, what is next:** nothing. Next is Task 84: split the epics into build tasks.
