# Task 081: settle open decision 7, when OVR is rolled

**Status:** Done (2026-10-27)

## Goal

Decide when a Team Instance gets its OVR, and how the Instance Edit in League Setup can change OVR and Tier. Tasks 93 and 94 build on these rules.

## Acceptance criteria

- [x] The user picks when the OVR is rolled.
- [x] The user picks the limits of an OVR override.
- [x] The user picks what happens to the OVR when the Instance Tier changes.
- [x] The `PROGRESS.md` Decisions log has an entry for the choices.
- [x] The `PROGRESS.md` Open questions list no longer has decision 7.
- [x] The report below records the choices and their effect on Tasks 93 and 94.

## Notes

- **2026-10-27:** Facts from the code and specs. MVP1 rolls each team's OVR once, when the league is created (`createLeague` in `src/app/state/leagueActions.ts`, Task 13). `rollOVR` (`src/engine/tier-ovr/tierOvr.ts`) is the only way to make an OVR, and the module has no OVR setter, because Tier is the source of truth (MVP1 spec §1). The Tier ranges are 10 points wide, from F = 30–39 to S = 90–99. MVP2 says: adding a Blueprint to a league creates an Instance with a rolled OVR, and Edit changes the Instance's "current OVR override, current Tier". MVP1 spec §1 says: when a team's Tier changes, its OVR is rolled again at once.
- **2026-10-27:** The user agreed the criteria. The user chose "At add-to-league", "Inside the Tier range", and "Roll again".

## Report

- **What was built:** no code. Decision 7 is settled.
  1. **Roll time:** an Instance gets its rolled OVR when its Blueprint is added to the league, by Select teams, Load them all, or Switch. The team list in setup shows the OVR. Remove, then add again, rolls a new OVR. This replaces the MVP1 roll at Create (Task 13).
  2. **Override limits:** an OVR override in Edit must stay inside the Instance Tier's range, for example 60 to 69 for Tier C. Tier stays the source of truth (MVP1 spec §1).
  3. **Tier change:** a Tier change in Edit rolls a new OVR from the new Tier at once. The user can then override it inside the new range.
- **Test approach:** none, no code changed.
- **Decisions made:** logged in the `PROGRESS.md` Decisions log on 2026-10-27.
- **Effect on other tasks:**
  - **Task 93 (Team Selection):** the draft store holds rolled Instances, not team references. Edit shows the OVR field with the Tier range as its limits. A Tier change in Edit rolls again.
  - **Task 94 (Teams Module):** a Blueprint edit does not change any Instance. The Instance keeps its own Tier and OVR.
  - **Engine:** `engine/tier-ovr` has no OVR setter today, on purpose. The override needs a range check there, for example a function that accepts an OVR only inside its Tier's range. The `rollOVR` doc comment then needs new words.
- **What is left, what is next:** next is decision 8 (Task 82).
