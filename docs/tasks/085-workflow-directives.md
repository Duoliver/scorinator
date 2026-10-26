# Task 85: MVP2 workflow directives

**Status:** Done (2026-10-26)

## Goal

Set three workflow rules for MVP2 before the next tasks start:

1. Refined user stories in their own files.
2. A short status board, with the detail in task files.
3. One task for every activity.

## Acceptance criteria

- [x] A home and a format for the refined user stories: `docs/user-stories/`, one file for each epic, with story IDs and checklist criteria.
- [x] One refinement task for each MVP2 epic on the status board.
- [x] A home and a template for the task files: `docs/tasks/`. The status board links to them.
- [x] A rule in `PROGRESS.md` that keeps the Notes column short.
- [x] A rule in `PROGRESS.md` and in `CLAUDE.md`: every activity is a task.
- [x] The existing MVP2 rows follow the new rules.

## Notes

- **2026-10-26:** The user asked if long notes cost context. Yes. The MVP1 `PROGRESS.md` grew to 132 KB, about 33,000 tokens. Each session read all of it at the start. Most of the size was in the Notes column and the Decisions log.
- **2026-10-26:** The user chose one file for each task (goal, criteria, notes, and report), not a notes file plus a report file. It replaces `progress-reports/` for MVP2.
- **2026-10-26:** The user chose plain checklist criteria for the stories, and parked Given / When / Then. The parked idea is in `docs/user-stories/README.md`.
- **2026-10-26:** The MVP2 spec has 11 epics. Claude first said 12 in chat, which was wrong.

## Report

- **What was built:**
  - `docs/tasks/README.md`: the rules and the template for a task file.
  - `docs/user-stories/README.md`: the story IDs, the template, the status values, and the parked Given / When / Then idea.
  - Report 074 moved to `docs/tasks/074-spec-edits.md`, with the task file shape. The empty root `progress-reports/` folder is gone.
  - `PROGRESS.md`: the new rules, a Task file column, a User stories section, and the refinement Tasks 86 to 96. Each decision row names the refinement tasks that can close it.
  - `CLAUDE.md`: one new line for the rule "every activity is a task".
  - `docs/code-review-checklist.md`: asks for a task file, not a report.
- **Test approach:** docs only, no test. All new and moved links resolve.
- **Decisions made:** see the Task 85 entry in the `PROGRESS.md` Decisions log.
- **What is left, what is next:**
  - The root `decisions-log/` folder stays, for the condensed decision files of the Decisions log procedure. A later task can move those into the task files, if the user wants one place.
  - `PROGRESS.md` is now 15 KB.
  - `CLAUDE.md` links to `/docs/tdd`, but the file is `docs/tdd.md`. This link was broken before Task 85. Fix it in its own task.
