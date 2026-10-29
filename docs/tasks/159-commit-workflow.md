# Task 159: the commit workflow

**Status:** Done (2026-10-29)

## Goal

Claude commits the work of a task when the user agrees that the task is Done, with a fixed message pattern. Push and branches stay with the user.

## Acceptance criteria

- [x] `CLAUDE.md` has a "Git commits" section: commit at Done, only the changes of the task, on the current branch, with no push and no branch change.
- [x] The section gives the subject forms: `task N: message`, `tasks N, M: message`, and `tasks N-M: message` for more than two consecutive tasks.
- [x] The section asks for a body: what changed and why, with the stories and the decisions.
- [x] The `CLAUDE.md` line about uncommitted state no longer conflicts with the Review status.
- [x] The `PROGRESS.md` status board rules say to commit at Done.
- [x] This change is committed first, before the Task 103 commit.

## Notes

- **2026-10-29:** Task created by User. The criteria come from the user request: "commit work when I consider it done, then follow the commit message pattern". The user gave the three subject forms and asked for a body. The user controls git push and the branches.
- **2026-10-29:** Claude choices: the 72-character limit for the subject and the body lines, the verb in the imperative, and the rule for more than one task Done at the same time. The Claude memory "never commit" is removed, because this rule replaces it.

## Report

- **What was built:** the "Git commits" section in `CLAUDE.md`, one changed line in its "Maintaining PROGRESS.md" section, and one sentence in the `PROGRESS.md` status board rules.
- **Test approach:** none, no code changed.
- **Decisions made:** the commit workflow, in the `PROGRESS.md` Decisions log on 2026-10-29.
- **What is left, what is next:** `docs/tdd.md` step 2 says "Prefer committing [the red] step separately when the workflow allows it". The workflow commits once, at Done, so it does not allow it. The line does not conflict, and it does not change.
