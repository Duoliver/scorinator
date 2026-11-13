# Task 250: fix the comma in the Season delete text

**Status:** Refactor

## Goal

The Season delete confirm puts a comma before "and" when two parts show: "This deletes its 3 leagues, and its 2 playoffs." Two parts need no comma. Found in the refactor pass of Task 212.

## Acceptance criteria

- [x] Two parts read "its 3 leagues and its 2 playoffs", with no comma.
- [x] One part and three parts read as before: "its 3 leagues", and "its 3 leagues, its roster of 8 teams, and its 2 playoffs".
- [x] A screen test for two parts, written first. The full suite, the type check, the lint, and the format check pass.

## Notes

- **2026-11-13:** Task created by User. The criteria are the words of the request.
- **2026-11-13:** Tests first. The two-part case failed, then passed. The one-part case passed before and after. The three-part case of Task 212 still passes.
- **2026-11-13:** The user agreed the review. Commit 1. Status Refactor.

## Report

- **What was built:** `joinWithAnd` in `features/seasons/SeasonsListScreen/helpers.ts` joins two parts with "and" and no comma.
- **Test approach:** two screen tests for the delete confirm: two parts and one part. The full suite passes: 2200 tests. The type check, the lint, and the format check pass.
- **Decisions made:** none.
- **What is left:** nothing.
- **Refactor:** waits for the review.
