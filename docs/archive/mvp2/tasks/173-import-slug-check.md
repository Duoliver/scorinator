# Task 173: the slug check in the team CSV and JSON imports

**Status:** Done

## Goal

Stop a team import when a slug has a character that `slug()` never makes, such as a space. Today the CSV and JSON parsers keep `north fc` as it is, and the slug list import of Task 118 can then never find that team.

## Acceptance criteria

The user agreed these criteria on 2026-10-30, with choices 1 to 4.

**The check (choices 1 and 2):**

- [x] A slug holds only the letters A to Z (any case), the digits 0 to 9, and hyphens. This is the Task 118 rule.
- [x] A CSV row with another slug stops the import with this error: `Team CSV row 3 has an invalid Slug "north fc". Use only letters, digits, and hyphens.`
- [x] A JSON entry with another slug stops the import with this error: `Team JSON entry 3 has an invalid slug "north fc". Use only letters, digits, and hyphens.`
- [x] The parse changes a valid slug to lower case: `FC-United` becomes `fc-united`, and updates that Blueprint.
- [x] An empty slug stays valid. The import makes a unique slug from the name, as today (Task 75).
- [x] A slug error shows in the status line, and no confirm opens (Task 168). No Blueprint changes.

**The place of the rule (choice 3):**

- [x] One `isSlug` check in `engine/identity`, next to `slug()`. The CSV parser, the JSON parser, and the slug list parse (`adapters/txt/slugList.ts`) use it.
- [x] The slug list parse keeps its own error text and its Task 118 behaviour.

**Code:**

- [x] Unit tests for `isSlug` and for each parser. One integration test with Testing Library: a bad slug on the Teams screen import shows the error and opens no confirm.
- [x] `npm run lint`, `npm run format:check`, `npm run type-check`, and `npm test` pass.

**Out of scope (choice 4):** a repair of a bad slug that is already in the database. The slug regenerate button in the team drawer (Task 167) fixes one. A repair of a bad slug at import, for example `north fc` to `north-fc`: a repaired slug can match a different team.

## Notes

- **2026-10-30:** Task created by User, from the Task 168 review. The user asked if the import is supposed to allow slugs with spaces. It is not. Facts from the code: `parseTeamsCsv` trims the slug cell, and `parseTeamsJson` takes any string. Neither checks the format. `slug()` makes only `a` to `z`, `0` to `9`, and hyphens. `adapters/txt/slugList.ts` has its own `SLUG_LINE` pattern.

- **2026-10-30:** Built. One effect to know: a Blueprint that already has an upper-case slug from an earlier import, for example `FC-United`, no longer matches the same slug in a file, because the parse changes the file slug to `fc-united`. The import then adds a new Blueprint. Choice 4 keeps such a slug as it is. The slug regenerate button fixes it.

## Choices for discussion

The user agreed these choices on 2026-10-30.

| # | Choice | Effect | Undo cost |
|---|---|---|---|
| ⚠ 1 | A bad slug stops the import with a row error, as a bad Tier does. | Nothing changes, and no confirm opens. The same rule as the Task 118 slug list. | Low |
| 2 | Upper case is valid, and the parse changes it to lower case. | `FC-United` matches `fc-united`, as the slug list match does. | Low |
| 3 | One `isSlug` check in `engine/identity`, next to `slug()`. The CSV, JSON, and slug list parsers use it. | One rule in one place. | Low |
| 4 | The import does not repair a bad slug that is already in the database. | The slug regenerate button fixes one. | Low |

## Report

- **What was built:**
  - `isSlug(value)` in `engine/identity`, next to `slug()`: letters A to Z in any case, digits, and hyphens. An empty value is not a slug.
  - `parseTeamsCsv` and `parseTeamsJson` stop at the first bad slug, with the row or entry number, and change a valid slug to lower case. An empty slug stays empty. The JSON parse also trims the slug, as the CSV parse does.
  - `parseSlugList` uses `isSlug` in place of its own pattern, with the same error text.
- **Test approach:** 12 new tests. Unit tests: `isSlug` (valid values, invalid values, and every `slug()` result), the CSV parse (a space with its row number, another character, lower case, an empty slug), and the JSON parse (the same four). One integration test with Testing Library: a bad slug on the Teams screen import runs the real read and parse on a fake file system, shows the error in the status line, opens no confirm, and changes no Blueprint. The 13 slug list tests pass with no change. Full suite: 977 tests pass. Lint, format check, and type check pass. The user checked the real app on 2026-10-30, and agreed the task is Done.
- **Decisions made:** choices 1 to 4, agreed by the user. Claude choices:
  - The JSON parse trims the slug before the check, as the CSV parse trims each cell.
  - The screen test uses the real `importTeamsFile` with a fake file system and dialog, so the test does not import `adapters/`.
- **What is left, what is next:** an upper-case slug that is already in the database no longer matches an import (see the Notes). Then the M2 smoke check (Task 122).
