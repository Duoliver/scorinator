# Task 204: approve MVP3 for the build, Must items only

**Status:** Done

## Goal

The user approves MVP3 for the build, with the Must items only. The scope line of `PROGRESS.md` and the scope section of `CLAUDE.md` show the new scope. A session can then start the build tasks of the Must stories.

## Acceptance criteria

- [x] The scope line of `PROGRESS.md` says: MVP1, MVP2, and the Must items of MVP3 are approved for the build. The Should and Could items of MVP3, and MVP4, are not approved.
- [x] The scope line names the Must items and their Agreed stories:
  - C1 to C5: US-13.1 to 13.9, and US-13.11. US-13.10 is C6, a Should item.
  - C10: US-14.1 to 14.4.
  - C36 and C44: US-15.1 to 15.6. US-15.7 is C7, a Should item.
  - C21, C45, and C46: US-16.1 to 16.5.
  - US-15.8 (pages for the teams list) has no item and no rank. It is in or out, as the user decides.
- [x] The section "Implementation scope" of `CLAUDE.md` follows the new scope. Its examples stay true for the new scope.
- [x] Each changed rule in `CLAUDE.md` has a dated note with the task number, as the other rules do.
- [x] The `PROGRESS.md` Decisions log has an entry for the approval.
- [x] The refinement of the Should items (Tasks 200 to 202, C23) stays allowed.

## Notes

- **2026-11-13:** Task created by User. Inputs: Task 195 ranks 12 Must items. C15 needs no build. All the stories of the other 11 Must items are Agreed (Tasks 196 to 199, 203).
- **2026-11-13:** Facts for the choices. The `CLAUDE.md` scope examples name a City field (MVP3) and Season grouping (MVP3). City left MVP3 in Task 195, and Season is now a Must item. The `CLAUDE.md` open item on the MVP3 Instance-scoping wording, and `PERSISTENCE.md` §2a (the last list), say that the MVP3 spec still says "scoped to one Season". The spec rewrite of Task 195 uses "scoped to one Instance Wrapper" (`scorinator-mvp3.md` §1 Season).
- **2026-11-13:** Two stories of the Must epics are Should items: US-13.10 (C6) and US-15.7 (C7). US-15.8 came from a Task 198 answer, with no C item and no rank.
- **2026-11-13:** The user agreed the criteria and four choices. US-15.8 is in the Must scope. Claude made the edits. The new `CLAUDE.md` heading changes its link anchor, so the scope link in `docs/code-review-checklist.md` changed too.
- **2026-11-13:** The user agreed the review: Done.

## Report

**Delivered:** MVP3 is approved for the build, with the Must items only.

- `PROGRESS.md`: the scope line names the 26 Must stories: US-13.1 to 13.9, US-13.11, US-14.1 to 14.4, US-15.1 to 15.6, US-15.8, and US-16.1 to 16.5. It names the Should items that stay out. A Decisions log entry records the approval.
- `CLAUDE.md`: the "Implementation scope" section follows the new scope. The Season example became a Should example (US-15.7). The City example stays, as out of MVP3 (Task 195). The open item on the MVP3 Instance-scoping wording is removed.
- `src/persistence/PERSISTENCE.md` §2a: the note on the same wording is removed. The Task 195 spec rewrite uses "Instance Wrapper".
- `docs/code-review-checklist.md`: the scope link follows the new `CLAUDE.md` heading.

**What is next:** no build task exists yet for the Must stories. A planning task can add the build tasks and their order.

**Refactor:** No code, no refactor step.
