# Task 119: Teams screen: the Location and Trigrams columns and drawer fields

**Status:** Done

## Goal

Give the Teams screen the Location and Trigrams columns and drawer fields, and the slug preview with the `-2` rule. The engine rules (Tasks 103, 115) and the CSV columns (Task 117) exist. This task puts them on the screen. Choice 1 moved the slug regenerate and Delete to Task 167, and the import confirm to Task 168.

## Acceptance criteria

The user agreed these criteria and the ten choices below on 2026-10-30. Choice 1 split Parts B and C into Tasks 167 and 168, with their criteria and choices.

**Part A: the list and the drawer fields (US-09.1, US-09.3, US-09.6):**

- [x] The Teams list columns: swatch, Name, Location, Trigrams, Tier, Slug, Edit. An empty Location shows "—".
- [x] The Trigrams column shows the list, for example `ASH · AFC`, in `--font-mono`. An empty list shows the trigram made from the name, in muted text.
- [x] The team drawer fields: "Team name", "Slug", "Location (optional)", "Trigrams (optional)", "Colour", "Tier".
- [x] "Location" trims the value. Over 40 characters, "Save" shows an error under the field and saves nothing.
- [x] "Trigrams" takes the codes split by spaces, and makes them uppercase. With an empty field, the placeholder shows the trigram made from the name, and follows the name as the user types.
- [x] A bad trigram, a duplicate, or more than 5 shows an error under the field at "Save", and saves nothing.
- [x] In the create drawer, the slug preview uses the `-2` rule: with "Ashfield" in the list, the name "Ashfield" shows `ashfield-2`.
- [x] The wizard "Create new team" (the same drawer) gets the same fields and the same rules.
- [x] The 40-character limit is one constant, shared by the CSV parse and the drawer.

**Code:**

- [x] Integration tests with Testing Library for each criterion above. Unit tests for any new `app/state` action.
- [x] `npm run lint`, `npm run format:check`, `npm run type-check`, and `npm test` pass.

**Out of scope:** the slug regenerate and Delete (Task 167). The import confirm (Task 168). The Location tooltip and the trigrams on the league screens (Task 157). The wizard team list (Tasks 120, 121). The File screen layout (Task 149). The team JSON parse (Task 145). A custom colour (MVP3).

## Notes

- **2026-10-30:** Facts from the code and the specs. The MVP2 handoff Teams screen has the MVP1 layout: Name, Tier, Slug, Edit, and the drawer with "Team name", "Slug (auto-generated)", "Colour", and "Tier". So the new places come from the stories. `TeamForm` is shared by the Teams screen and the wizard "Create new team". Its slug preview uses `slug()`, with no `-2` rule. `updateTeamBlueprint` cannot change the slug. `Input` has no `maxLength`. The leagues load on demand (`openLeague`, Task 161), and a manifest row has no Blueprint UUIDs, so a count of the leagues that use a Blueprint must open each league. The import actions in `app/loadActions.ts` apply at once, and three screens call them. `ConfirmDialog` has a `destructive` tone. US-09.7 is already done (Task 114).
- **2026-10-30:** The user agreed the criteria and choices 1 to 10. Choice 1: Part B is now Task 167, and Part C is now Task 168. Their task files hold their criteria and choices (7 and 8 for Task 167, 9 and 10 for Task 168).

## Choices for discussion

| # | Choice | Effect | Undo cost |
|---|---|---|---|
| ⚠ 1 | Split the task: Part A stays Task 119. Part B becomes new Task 167, and Part C new Task 168. Each one gets its own review and commit. | Three reviews of about 1 to 2 hours of work each, in place of one large review. Task 120 waits for 119 only. | Low |
| ⚠ 2 | Field order: Team name, Slug, Location, Trigrams, Colour, Tier. The slug stays next to the name that makes it. | The stories say "after Team name" for both new fields. This order keeps both near the name. | Low |
| 3 | An empty trigram list shows the name trigram in muted text in the list. | The user sees the code that a league uses. | Low |
| 4 | The Location limit shows as an error at "Save", not as a field limit. | No `Input` change in `design-system/`. | Low |
| 5 | The 40 moves to `engine/identity` as `MAX_LOCATION_LENGTH`, next to `MAX_TRIGRAMS`. | Both `adapters/csv` and `features/` can import it. | Low |
| 6 | Trigram errors in the drawer: `"AS" is not a trigram. Use 3 letters or digits.`, `"ASH" is in the list twice.`, `Use 5 trigrams at most.` | The same rules as the CSV, with shorter texts. | Low |
| ⚠ 7 | The Delete count opens each league that is not in memory, before the confirm shows. | The count is right for every league. With many leagues, the confirm can take a moment. A read error shows in the status line. | Medium |
| 8 | `updateTeamBlueprint` accepts a new `slug`, and throws when another Blueprint has it. | The regenerate saves through the same action as the other fields. | Low |
| ⚠ 9 | The import confirm also opens on the Leagues empty state and the File screen buttons. One shared hook in `features/components/` holds the confirm. | Every team import asks first, as Task 75 says. | Low |
| 10 | A file with no team skips the confirm, and shows "The file has no teams." | No empty "0 new, 0 updated" question. | Low |

## Report

- **What was built:**
  - The Teams list has the Location and Trigrams columns. An empty Location shows "—". An empty trigram list shows the name trigram in muted mono text.
  - `TeamForm` has "Location (optional)" and "Trigrams (optional)", with the checks at "Save" and one error under each bad field. The Trigrams placeholder follows the name.
  - A new team's slug preview uses `uniqueSlug`, with the `-2` rule. The Teams screen and the wizard pass the taken slugs.
  - `TeamFields` holds six fields now. `MAX_LOCATION_LENGTH` is in `engine/identity/location.ts`, and the CSV parse uses it.
- **Test approach:** integration tests with Testing Library, 19 new. The form: the field order, the save values, 40 and 41 characters, the three trigram errors, the placeholder, typed values that stay, the `-2` preview, and the fixed slug of an edit. The Teams screen: the column order, the "—", the trigram text, a create and an edit with the new fields, and the `-2` preview. The wizard: a create with the new fields, and the `-2` preview. I wrote the 2 wizard tests after the code, so they did not fail first. Full suite: 867 tests pass. Lint, format check, type check, and `npm run build` pass. I did not run the real app: please check it with `npm run tauri:dev`.
- **Decisions made:** choices 1 to 6, agreed by the user. Choices 7 to 10 belong to Tasks 167 and 168. Claude choices:
  - The slug label stays "Slug (auto-generated)", as in the handoff.
  - The Trigrams placeholder is "e.g. ASH AFC" while the name has no letter or digit. The Location placeholder is "e.g. Ashfield".
  - In the edit drawer, the slug no longer follows a rename. Before, the field showed the new slug, but "Save" kept the old one (US-09.5).
- **What is left, what is next:** Task 167 adds the slug regenerate and Delete. Task 168 adds the import confirm. Task 120 builds the wizard team list.
