# Task 094: refine epic 09, Teams Module (Blueprints)

**Status:** Done (2026-10-28)

## Goal

Refine the two spec stories of epic 09, US-09.1 and US-09.2, with acceptance criteria, in `docs/user-stories/mvp2/09-teams-module.md`. The file already has US-09.3 (Task 99), which stays as it is. Find the gaps in the spec and get an answer for each. The build tasks (Task 84) start from these stories.

## Acceptance criteria

- [x] `docs/user-stories/mvp2/09-teams-module.md` has US-09.1 and US-09.2, in the README template. US-09.3 does not change.
- [x] A new story gets the next free ID, only when a gap needs one.
- [x] Each story has checkable criteria, an Out of scope line, and Notes that link to the spec and the decisions.
- [x] Each gap found has a user answer, or an entry in the `PROGRESS.md` Open questions.
- [x] The stories use the settled decisions: the CSV slug match and unique slugs (Task 75), the OVR rules (Task 81), the Instance fields copied at add (Task 93, US-08.4), no City or Crest (Task 74), and the Location label (US-09.3).
- [x] The stories follow the MVP2 handoff where it shows the screen, unless the user overrides it.
- [x] A spec edit happens only with the user's OK.
- [x] The user agrees each story, and its status becomes Agreed.

## Notes

- **2026-10-28:** Spec stories of epic 09 (`docs/scorinator-mvp2.md` §2): a global "Teams" list of reusable Blueprints, apart from any league, and a league state for each team (OVR, Tier) apart from the Blueprint. Spec rules: §1 Teams Module (Blueprints). Since Task 93, the Instance also holds a name and a colour.
- **2026-10-28:** Settled inputs. CSV rows match Blueprints by slug, with one confirm dialog. Slugs are unique: a second Blueprint with the same name gets `-2` (Task 75). An Instance copies the name, colour, and Tier at add, and gets a rolled OVR. A Blueprint edit changes no Instance (Tasks 81, 93). A Blueprint has no City or Crest (Task 74). The Location label lives on the Blueprint only (US-09.3). The UUID and provenance belong to epic 11 (Task 96).
- **2026-10-28:** Facts from the code and the handoff. The MVP1 Teams screen (`src/features/teams/`) lists the teams with a colour, Name, Slug, and Tier, with create and edit in a drawer. The team actions are `addTeam`, `updateTeam`, and `setTeams` (`src/app/state/teamsActions.ts`). MVP1 has no team delete. The team form makes the slug from the name (`src/features/components/TeamForm/useTeamForm.ts`). The handoff Teams screen has the same visible text as MVP1, with "Slug (auto-generated)" (Task 83).
- **2026-10-28:** Gaps found. Each needs a user answer.
  1. Can the user delete a Blueprint? MVP1 has no delete.
  2. Does a rename change the slug? CSV matching (Task 75) and the slug list import (US-08.7) use the slug.
- **2026-10-28:** The user agreed the criteria. Gap 1 answer: delete always, with a confirm. The leagues keep their Instances. A "restore team Blueprint from a league" is parked in `scorinator-future-features.md` §11.
- **2026-10-28:** Gap 2: the user first chose "the slug follows the name", and asked about the risks. Claude listed four: a CSV rename (Task 75) breaks the next import of the same CSV, an old CSV creates duplicates, old slug lists miss the team, and the `-2` rule makes slugs change. The user then chose "fixed at create, with a regenerate button". The button is an icon at the side of the slug field, with a hover hint, an `aria-label`, and a confirm.
- **2026-10-28:** Claude wrote US-09.1, US-09.2, US-09.4 (delete), and US-09.5 (slug), with the status Refined. US-09.3 does not change.

- **2026-10-28:** The user agreed US-09.1, US-09.2, US-09.4, US-09.5, the Claude choices, and four spec edits. Status: Agreed. Claude edited `docs/scorinator-mvp2.md` §1 Teams Module (the Instance slug, a Slug bullet, a Delete bullet) and §2 (two story lines). US-08.4 now says the slug is the one the Instance copied at add.

## Report

- **What was built:** `docs/user-stories/mvp2/09-teams-module.md` now has five Agreed stories. US-09.1 and US-09.2 come from the spec. US-09.3 is from Task 99. US-09.4 (delete) and US-09.5 (fixed slug, regenerate button) are new.
- **Test approach:** none, no code changed. The stories name the tests: the slug rule (US-09.5), and the edit isolation in both directions between a Blueprint and an Instance (US-09.2).
- **Decisions made:** the gap answers and the confirmed Claude choices in the Notes above, and in the `PROGRESS.md` Decisions log on 2026-10-28.
- **Spec edits:** four, in `docs/scorinator-mvp2.md` §1 and §2, with the user's OK. Each one is marked with its date and Task 94.
- **Parked:** `docs/scorinator-future-features.md` §11, restore a team Blueprint from a league.
- **Effect on other tasks:**
  - **Task 95 (File Module):** the league slug list export can read the Instance slug, also after a delete. The Blueprint JSON export carries the slug as it is.
  - **Task 96 (Identity):** an Instance keeps the UUID of a deleted Blueprint. An import of that Blueprint later is a new entity, or a match by UUID: settle it there.
  - **Design system:** an icon-only Button variant, the Tooltip primitive (US-09.3), and the confirm modal (impact review §2.13).
- **What is left, what is next:** nothing. Next is Task 95, File Module.
