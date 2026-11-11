# Task 192: archive the MVP2 log

**Status:** Done

## Goal

Start the MVP3 preparation with a short, fresh `PROGRESS.md`. The MVP2 log, its task files, and its decisions move to `docs/archive/mvp2/`, read only, as the MVP1 log did on 2026-10-26.

## Acceptance criteria

Agreed with the user on 2026-11-11.

- [x] 1. `PROGRESS.md` moves to `docs/archive/mvp2/PROGRESS.md` with `git mv`, with an "Archived on 2026-11-11. Read only." line at the top.
- [x] 2. The 118 task files (074 to 191) move to `docs/archive/mvp2/tasks/`. `docs/tasks/README.md` stays.
- [x] 3. Every link to a moved file follows it.
- [x] 4. `docs/mvp1-to-mvp2-impact-review.md` moves to `docs/archive/mvp2/`.
- [x] 5. The MVP2 user stories stay in `docs/user-stories/mvp2/`.
- [x] 6. A new `PROGRESS.md` with the same sections and rules. The scope line stays "MVP1 and MVP2 only".
- [x] 7. The 4 open questions carry over.
- [x] 8. The new decisions log starts empty, with links to both archives.
- [x] 9. The status board starts with Task 192. Numbers go on from 193.
- [x] The user reviews the new log.

## Notes

- **2026-11-11:** Task created by User. "We will start MVP3 preparations. First, we gotta archive the MVP2 log." Then the user proposes workflow changes, and then the MVP3 scope and its refinement.
- **2026-11-11:** Facts. The MVP1 archive (commit `40e1579`, by the user) moved `PROGRESS.md`, `progress-reports/`, and `decisions-log/` into `docs/archive/mvp1/`, with an "Archived, read only" line at the top. The MVP2 log has 417 lines: the status board (Tasks 74 to 191, all Done or Cancelled), 4 open questions, and the decisions log inline. `docs/tasks/` holds 119 task files (074 to 191, and `README.md`). 15 docs link to `docs/tasks/`, mostly the MVP2 user stories. No code links to it. The root `decisions-log/` holds only `.gitkeep`.
- **2026-11-11:** The user agreed choices 1 to 9.
- **2026-11-11:** Two files of the MVP1 archive linked to the impact review by its old path: `docs/archive/mvp1/PROGRESS.md` and `progress-reports/054-match-lookup.md`. Their links follow the move. Only the path changes, not the text.

## Report

- **What was built:** `docs/archive/mvp2/` holds the MVP2 log, its 118 task files, and the impact review, all moved with `git mv`. 316 links in 21 Markdown files now point there. A new 75-line `PROGRESS.md` keeps the rules, the scope line, and the 4 open questions, with Task 192 as its first row. `docs/tasks/README.md` names the archive.
- **Test approach:** no code changed. A script checks every absolute link in the Markdown files: all of them resolve.
- **Decisions made:** choices 1 to 9, agreed by the user. Claude choice: the new log keeps the old rule texts as they are, because the user plans workflow changes next. Only the scope note, the numbering note, and the archive links are new. The MVP2 notes on milestones and sprint 0 stay in the archive.
- **What is left, what is next:** the user proposes the workflow changes. Then the MVP3 scope and its refinement. The root `decisions-log/` is still empty.
