# Task files

Each task on the `PROGRESS.md` status board has one file here, from MVP2 on (Task 74 and later). The file holds the task details that are too long for the board: the goal, the acceptance criteria, the notes, and the report. MVP1 used `progress-reports/` instead. Those files are in `docs/archive/mvp1/`.

**Why a file per task:** the status board stays short, so a session can read it at the start for little context. A session reads a task file only when it works on that task.

## Rules

- **Name:** `NNN-short-slug.md`, with the task number from the status board, for example `085-workflow-directives.md`.
- **When to create it:** when the task starts, at the latest. For an unplanned request, create the file before the work starts. Agree the goal and the criteria with the user first.
- **Link:** the Task file column of the status board links to the file.
- **Size:** a small task gets a small file. A few lines in each section are enough.
- **Decisions:** log each decision in the `PROGRESS.md` Decisions log. The task file can hold the detail, and the log entry links to it.

## Template

```markdown
# Task NNN: short title

**Status:** Not started | In progress | Blocked | Review | Done

## Goal

One to three sentences. What the task gives the user, and why.

## Acceptance criteria

- [ ] A result that you can check. Agree the list with the user before the work starts, or at review at the latest.
- [ ] ...

## Notes

Dated entries, newest last. Findings, choices made during the work, and anything the next session needs.

- **YYYY-MM-DD:** ...

## Report

Write this before the task goes to Review.

- **What was built:** one or two sentences.
- **Test approach:** what the tests cover, what kind of tests (unit, integration, statistical), and anything left untested on purpose, with the reason.
- **Decisions made:** each one is also in the `PROGRESS.md` Decisions log.
- **What is left, what is next:** anything nearby that you saw but left out of scope.
```

If a task stops before it finishes, say so plainly in the report. State what is done, what is broken or missing, and what decision or input the work needs to continue.
