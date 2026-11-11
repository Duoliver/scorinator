# Task 099: a Location label on each team

**Status:** Done (2026-10-28)

## Goal

Write one refined story for an optional free-text Location on each Team Blueprint, with every place it shows. The story goes in epic 09 as US-09.3. The build tasks (Task 84) start from it.

## Acceptance criteria

- [x] `docs/user-stories/mvp2/09-teams-module.md` has US-09.3, in the README template.
- [x] The story lists each place the location shows, and each file format that carries it.
- [x] The story says how the label relates to the MVP3 City, and the `PROGRESS.md` Open questions hold what MVP3 does with it.
- [x] A spec edit happens only with the user's OK.
- [x] The user agrees the story, and its status becomes Agreed.

## Notes

- **2026-10-28:** Task created by the user, after Task 90 dropped Region Adjacency. The user asked for a "location" field on each team for MVP2, just a string, and asked to map where it shows.
- **2026-10-28:** Scope check. `CLAUDE.md` uses "do not add a City field to Team Blueprint" as its MVP3 example. Task 74 Edits 3 and 4 removed City from the MVP2 Blueprint and the MVP2 CSV. Facts from the code: `TeamRecord` (`src/domain/team.ts`) has `slug`, `name`, `colour`, and `tier`. The CSV adapter (`src/adapters/csv/teams.ts`) finds each column by its header label. League Detail has no team roster tab. The design system has no Tooltip primitive.
- **2026-10-28:** The user chose: (1) a free label, approved as MVP2 scope, not a City. MVP3 decides later what to do with it. (2) It shows in the Teams list, the Select-teams dialog, the league team list, and as a tooltip in standings and tie cards. (3) An optional CSV column. (4) A new task, 99, with the story as US-09.3.
- **2026-10-28:** Claude wrote US-09.3, with the status Refined.

- **2026-10-28:** The user agreed US-09.3, the three Claude choices (40 characters at most, a 4-column CSV keeps the location, a Tooltip primitive as its own build task), and three spec edits. Status: Agreed. Claude edited `docs/scorinator-mvp2.md` §1 Teams Module (the Blueprint line and the CSV line) and §2 Epic: Teams Module (a new story line).

## Report

- **What was built:** US-09.3 (Agreed) in `docs/user-stories/mvp2/09-teams-module.md`: an optional free-text Location on each Blueprint, with its display places and file formats.
- **Test approach:** none, no code changed. The criteria name the tests: the trim and the limit, the CSV with and without the column, the JSON round trip, and the search match.
- **Decisions made:** logged in the `PROGRESS.md` Decisions log on 2026-10-28.
- **Spec edits:** three, in `docs/scorinator-mvp2.md` §1 and §2, with the user's OK. Each one is marked with its date and Task 99.
- **Effect on other tasks:**
  - **Task 94 (Teams Module):** refines US-09.1 and US-09.2 in the same file. Keep US-09.3 as it is.
  - **Task 93 (Team Selection):** the Select-teams dialog row and its search include the location.
  - **Task 84 (build tasks):** add a Tooltip primitive task in `design-system/` before the tooltip work.
  - **MVP3:** an Open question in `PROGRESS.md` asks what happens to the label when City arrives.
- **What is left, what is next:** nothing. Next is Task 91, Single Duels Home/Away Balancing.
