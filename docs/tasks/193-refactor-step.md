# Task 193: workflow, a refactor step before Done

**Status:** Done

## Goal

Add a refactor step to each task, after the review and before Done. The step checks the changes of the task against the coding standards and fixes each gap at once. This stops a long cleanup at the end of an MVP, as MVP1 needed (Task 49 and the refactor tasks after it).

## Acceptance criteria

Agreed with the user on 2026-11-11.

- [x] 1. A new status, 🟦 Refactor, between Review and Done. It covers the pass and its review. The Notes column says which.
- [x] 2. Commit 1 when the user agrees with the review. The status then goes to Refactor.
- [x] 3. Commit 2 has a subject that starts with "refactor". A pass with no change gives "refactor pass, no change", with only the Done lines.
- [x] 4. The pass reads the review checklist first, against the diff of the task. One checklist entry says to read the local docs of each module or feature that the task touched. Then a search for old names, lint, the format check, the type check, and the full suite.
- [x] 5. A gap outside the diff goes in the task notes. The user decides if it gets a task.
- [x] 6. Every change after the implementation happens during Review. At Refactor, the task is closed to new work: only plain refactoring. A new request becomes a new task. The refactor review lists each change to markup or CSS, and the user chooses a new check.
- [x] 7. A task with no code skips the step, with one commit at Done.
- [x] 8. The task report gets a "Refactor" line.
- [x] 9. The changes go in `CLAUDE.md`, `PROGRESS.md`, `docs/tdd.md`, and `docs/tasks/README.md`.
- [x] 10. Task 194 rewrites the checklist, with a link from each entry to its rule, and the entry for local docs.
- [x] 11. A bug that the pass finds goes in the task notes, not in the pass.
- [x] The user reviews the doc changes.

## Notes

- **2026-11-11:** Task created by User. "I want to add a refac phase to the workflow, which would take place after the review and before calling the task done." The user asked first how Claude works. Claude's answer: the tests of a task come first, then the code, then Prettier, lint, the type check, and the full suite. Red and green run for the whole task, not for each test. Step 4 of `docs/tdd.md` (refactor) has no pass of its own, and nothing checks the diff against `docs/coding-standards.md` before Review. Example from this session: the comment of `TEAM_SEARCH_PLACEHOLDER` (Task 165) names the two dialogs that use it, against the "say why, not who calls it" rule.
- **2026-11-11:** The user's frame. Two reviews for each task: one for the task, one for its refactor. Two commits for the task. The user also asked to update `docs/code-review-checklist.md` to the coding standards and the module boundaries of today. The checklist is still the first version from about two months ago.
- **2026-11-11:** First proposal: 10 choices (flow, a 🟦 Refactor status, two commits, the pass, gaps outside the diff, re-checks, tasks with no code, the report line, the files, the checklist as Task 194).
- **2026-11-11:** The user changed two choices. (a) Every change after the implementation happens during Review. At Refactor, the task is closed to new work: only plain refactoring. A new request for the task becomes a new task. (b) The pass reads the checklist first. Each checklist entry links to its rule in the docs. One checklist entry says to read the local docs of the module or feature that the task touched.
- **2026-11-11:** The user agreed choices 1 to 11, with the two changes above.

## Report

- **What was built:** `docs/tdd.md` has a new section, "The refactor step": the flow, the pass, what the pass does not fix, the refactor review, and the skip for a task with no code. `CLAUDE.md` (PROGRESS rules, Git commits, commit 2 subject), `PROGRESS.md` (review rule, status legend), and `docs/tasks/README.md` (status values, the "Refactor" report line) link to it or follow it.
- **Test approach:** no code. The rule text lives in one place, `docs/tdd.md`, and the other files point to it.
- **Decisions made:** choices 1 to 11, agreed by the user.
- **What is left, what is next:** Task 194 rewrites `docs/code-review-checklist.md`. Until then, the pass uses the old checklist. This task has no code, so it skips the refactor step.
- **Refactor:** No code, no refactor step.
