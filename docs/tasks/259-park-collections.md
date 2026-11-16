# Task 259: take collections out of M4, and park them with the MVP3 Should and Could items

**Status:** Done

## Goal

Take the collection stories out of the approved MVP3 build. Collections (C36) stay in the MVP3 spec, but are not approved, as the Should and Could items. M4 then builds the team search and the pages only.

## Acceptance criteria

- [x] The `PROGRESS.md` scope line does not name the collection stories. Its "Not approved" list names them.
- [x] The rank of C36 follows the user's choice (choice 1): Should.
- [x] The M4 rows of the status board match the new map: collection tasks cancelled, the other rows and their dependencies changed.
- [x] The build map in Task 205 shows the change, with a dated note.
- [x] Epic 15 and `docs/scorinator-mvp3.md` show that collections are not approved for the build.
- [x] A `PROGRESS.md` Decisions log entry records the change.
- [x] No code changes.

## Notes

- **2026-11-16:** Task created by User. The collection stories are US-15.1, US-15.2, US-15.4, and US-15.5. US-15.3 is the "Teams" and "Collections" tabs. US-15.6 (search) and US-15.8 (pages) do not need collections. The M4 tasks with collection work are 233, 234, 235, 238, 239, 240, and 241.
- **2026-11-16:** The user agreed the criteria and five choices. (1) C36 moves from Must to Should. (2) US-15.3 goes with the collection stories: the Teams screen gets no tabs. (3) Tasks 234, 235, 239, and 240 are ❌ Cancelled. Their numbers stay used. (4) Task 233 demos the search field and the page controls only. (5) Tasks 236, 237, 238, and 241 stay, with no collection parts. Task 241 waits for Task 238 only.
- **2026-11-16:** The "Add teams" dialog and the Season roster dialog already search the name and the Location. Task 237 still puts one shared search in the three places. The placeholders differ today: "Search by name or location…" and "Name or Location". Task 237 can make them the same.
- **2026-11-16:** The user agreed the review: Done.

## Report

- **What was built:** no code. Collections (C36, US-15.1 to US-15.5) are out of the build. M4 now has five live tasks: 233, 236, 237, 238, and 241.
- **Files changed:** `PROGRESS.md` (the scope line, the M4 rows, this row, a Decisions log entry), `docs/tasks/205-mvp3-build-tasks.md` (the M4 map, a dated note), `docs/user-stories/mvp3/15-teams-module.md` (a "Build: not approved" line on US-15.1 to US-15.5, "Teams screen" in US-15.6 and US-15.8), `docs/scorinator-mvp3.md` (C36 is Should).
- **Test approach:** no code, no tests. A search found no other live reference to the collection stories as approved work. Old task files and old Decisions log entries stay as history.
- **Decisions made:** the five choices above. They are in the `PROGRESS.md` Decisions log.
- **What is left, what is next:** future features §36 and §39 say "In MVP3" for US-15.5 and US-15.2. The stories stay in the MVP3 spec, so the text stays true. The approved Must stories go from 26 to 21.
- **Refactor:** No code, no refactor step.
