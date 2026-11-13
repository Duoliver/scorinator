# Task 251: check the unique roster trigrams of a Season file

**Status:** Refactor

## Goal

The Season file parser of Task 209 does not check that each roster trigram is unique. A file with two equal trigrams opens, and the next join throws. The parser rejects such a file, with a clear message. Found in the review of Task 213.

## Acceptance criteria

- [x] `parseSeasonFile` rejects a roster with two teams of one trigram: "A Season file is not valid: team 2 has the same trigram as team 1."
- [x] An empty trigram counts too, so a file from a broken save cannot open with two empty trigrams.
- [x] An adapter test, written first. The full suite, the type check, the lint, and the format check pass.

## Notes

- **2026-11-13:** Task created by User. From the review of Task 213.
- **2026-11-13:** Started. The board row of this task went into the Task 213 refactor commit (`ebe0d80`) by mistake: the row was added before that commit. The task file and the code come in the commits of this task.
- **2026-11-13:** Tests first: the new case failed, then passed. Two roster teams with an empty trigram also fail, as the criteria ask.
- **2026-11-13:** The user agreed the review. Commit 1. Status Refactor. Refactor pass: no change. Waits for the refactor review.

## Report

- **What was built:** `parseSeasonFile` checks that each roster trigram is unique, with `checkUnique`, after the Blueprint UUID check.
- **Test approach:** one adapter test with two cases: an equal trigram, and two empty trigrams. The full suite passes: 2217 tests. The type check, the lint, and the format check pass.
- **Decisions made:** none.
- **What is left:** nothing.
- **Refactor:** no change. The pass read the 8 lines of code and the test against the checklist: the comment says why, the check reuses `checkUnique`, and the test came first.
