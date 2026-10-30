# Task 118: the slug list parse

**Status:** Done

## Goal

Build the pure parse of a slug list file in `adapters/txt` (US-08.7). The wizard "Import slug list" (Task 120) reads the file with it. No screen and no file dialog uses it in this task.

## Acceptance criteria

The user agreed these criteria and the five choices below on 2026-10-30, with choice 3 changed by the user.

- [x] `parseSlugList(text)` gives the slugs of a slug list file, one for each line, in file order.
- [x] The parse trims each line. It ignores a blank line, and a line that starts with `#` after the trim.
- [x] The parse accepts `\n`, `\r\n`, and `\r` line ends, and ignores a byte order mark at the start of the file.
- [x] The parse keeps the case and the duplicates of the file. Task 120 matches the slugs with no case, and skips a second copy.
- [x] A slug line holds only the letters A to Z (any case), the digits 0 to 9, and hyphens. Another line stops the parse with an error that names the line number, the line, and the rule: `Slug list line 4, "north fc", is not a slug. Use only letters, digits, and hyphens, with no spaces or other characters.`
- [x] The line number counts every line of the file, also the blank lines and the comments, so the user finds the line in a text editor.
- [x] A file with no slug gives an empty list, not an error.
- [x] The function is in `adapters/txt/slugList.ts`, exported from `adapters/txt`. It has no imports.
- [x] Unit tests for each rule above, and for the comment line of the US-10.5 export: `# Coastal Premier — final ranking, 2026-10-28`.
- [x] `npm run lint`, `npm run format:check`, `npm run type-check`, and `npm test` pass.

**Out of scope:** the `app/data` file read and the `.txt` dialog filter (Task 120). The match with the Blueprints, the counts, the alert, and the error message (Task 120). The slug list writer (Task 148).

## Notes

- **2026-10-30:** Facts from the code and the specs. `adapters/txt` holds only `serializeResultsTxt`. US-08.7 says that the parse is a pure function in `adapters/txt`, and that the file read goes through the app data layer. US-10.5 says that the export starts with one comment line, which the import ignores. `slug()` in `engine/identity` always gives lower case.
- **2026-10-30:** The user changed choice 3. A line that is not a slug is a file error, not a "not found" slug. The error names the line, and says that spaces and other special characters are not valid. `slug()` gives only `a` to `z`, `0` to `9`, and hyphens, so the check uses that set, in any case (choice 1).

## Choices for discussion

| # | Choice | Effect | Undo cost |
|---|---|---|---|
| ⚠ 1 | The parse keeps the case of each line. Task 120 compares with no case. | The "not found" alert shows each slug as the user typed it. | Low |
| 2 | The parse keeps the duplicates. Task 120 skips a second copy. | The parse stays a plain line reader. Task 120 counts in one place. | Low |
| ⚠ 3 | The parse checks the slug format. A line with a space, an accent, or another character outside A to Z, 0 to 9, and the hyphen stops the parse with an error. Changed by the user on 2026-10-30. | A typing error shows as a file error with its line. The file adds no team. | Low |
| 4 | Only a full line is a comment. `ash # note` is not a comment, so it fails the format check of choice 3. | No inline comments. The US-10.5 export writes none. | Low |
| 5 | The `app/data` file read and the `.txt` filter go in Task 120, as the build map says. | Task 118 stays inside `adapters/txt`. | Low |

## Report

- **What was built:** `parseSlugList(text)` in `adapters/txt/slugList.ts`, exported from `adapters/txt`. It gives the slugs of the file in order, with the case and the duplicates of the file. It throws for the first line that is not a slug, with the line number.
- **Test approach:** unit tests, 13 new: the file order, the trim, blank lines, comments, the US-10.5 comment line, the three line ends, the byte order mark, case and duplicates, the valid characters, an empty file, and the error for a space, an underscore, an accent, a dot, a slash, and a comment at the end of a line. One test checks that the line number counts blank lines and comments. Full suite: 848 tests pass. Lint, format check, type check, and `npm run build` pass.
- **Decisions made:** the five choices above, agreed by the user, with choice 3 changed by the user. Claude choices: the parse removes a byte order mark before the line split. A line of hyphens only, such as `-`, passes the check: Task 120 does not find it.
- **What is left, what is next:** no screen uses the parse yet. Task 120 adds the `app/data` file read with the `.txt` filter, the match with no case, the counts, the alert, and the message for an empty list.
