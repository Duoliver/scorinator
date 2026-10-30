# Task 167: slug regenerate and Delete in the team edit drawer

**Status:** Done

## Goal

Give the team edit drawer its two actions: a new slug from the name (US-09.5), and Delete (US-09.4). Each one asks first, with a confirm.

## Acceptance criteria

The user agreed these criteria on 2026-10-30, as part of Task 119 (choice 1 split it from Task 119).

**The edit drawer actions (US-09.4, US-09.5):**

- [x] In the edit drawer, the slug is read only, with an icon button at its right side: the hint "Regenerate slug from name", the `aria-label` "Regenerate slug from the team name".
- [x] The button is disabled when the name gives the same slug. Its hint then says "The slug already matches the name."
- [x] A click opens the confirm "Regenerate slug?" with the US-09.5 text and the buttons "Cancel" and "Regenerate". "Regenerate" puts the new slug in the field, with the `-2` rule, not counting the Blueprint itself. "Save" writes it. "Cancel" in the drawer drops it.
- [x] The edit drawer has a "Delete team" button. It opens the confirm "Delete Ashfield Rovers?", with "3 leagues use this team. They keep their own copy, but lose its Location." when leagues use it. The buttons are "Cancel" and "Delete".
- [x] "Delete" removes the Blueprint and closes the drawer. The leagues keep their Instances. The slug is free again.

**Code:**

- [x] Integration tests with Testing Library for each criterion above. Unit tests for any new `app/state` action.
- [x] `npm run lint`, `npm run format:check`, `npm run type-check`, and `npm test` pass.

**Out of scope:** a restore of a deleted Blueprint (`scorinator-future-features.md` §11). The Location tooltip on the league screens (Task 157).

## Notes

- **2026-10-30:** Split from Task 119 (choice 1). Facts from the code are in the Task 119 notes.
- **2026-10-30 (review):** The user asked for a regenerate button as tall as the slug field, and still square. The `Input` height came from its font and padding, with the browser line height, so no token held it. Now `Input` sets `line-height: var(--line-height-field)` (1.25), and the new token `--field-height` gives its outer height. A new icon button option, `fieldHeight`, makes a square of that height. The regenerate button uses it. Every `Input` now has the fixed line height, so a field can change by about 1 pixel in height.
- **2026-10-30 (review):** The user kept the fixed line height for now, and asked to log it as technical debt: new Task 169. The better way is a flex row inside `Input` (an optional slot at the right side of the input box), with a stretched, square button (`aspect-ratio: 1 / 1`). The row must hold the input box only, not the label, or the button gets the label height too.
- **2026-10-30 (review):** The user found the drawer buttons too big, and "Delete team" too visible for a rare action. The user chose: all drawer buttons use the `sm` size. "Delete team" uses the `outline` look, in its own row below "Cancel" and "Save". Claude choice: the Delete row is at the right, under the other two. The wizard "Create new team" drawer gets the `sm` buttons too, because it uses the same form.
- **2026-10-30 (review):** `Button` had no red outline variant. The user asked for one. New variant `destructive-outline`: white, with red text and a red border (`--color-error`), and no shadow. The hover fills it red with white text. Red on white is 9.44:1, and the contrast test now checks that pair. "Delete team" uses it. A class test was useless, because the test setup returns any class name, so the type check and the render test are the checks.

## Choices for discussion

The user agreed these choices on 2026-10-30, with the Task 119 numbers.

| # | Choice | Effect | Undo cost |
|---|---|---|---|
| ⚠ 7 | The Delete count opens each league that is not in memory, before the confirm shows. | The count is right for every league. With many leagues, the confirm can take a moment. A read error shows in the status line. | Medium |
| 8 | `updateTeamBlueprint` accepts a new `slug`, and throws when another Blueprint has it. | The regenerate saves through the same action as the other fields. | Low |

## Report

- **What was built:**
  - `app/state/teamBlueprintActions.ts`: `updateTeamBlueprint` accepts a `slug`, and throws a `RangeError` for a slug of another Blueprint. New `deleteTeamBlueprint(uuid)` and `countLeaguesUsingBlueprint(uuid)`. The count opens each league that is not in memory.
  - `TeamForm`: in the edit drawer, a `↻` icon button at the right side of the slug, with a hint and a "Regenerate slug?" confirm. A new `onDelete` prop shows "Delete team".
  - The Teams screen: "Delete team" counts the leagues, then opens the "Delete Ashfield Rovers?" confirm. "Delete" removes the Blueprint and closes the drawer. "Save" writes a regenerated slug.
- **Test approach:** 29 new tests. Unit tests for the store: the new slug, a taken slug, no Instance change, the delete, a free slug after it, and the count of saved and new leagues. Integration tests with Testing Library: the button states and hints, the confirm text with the `-2` rule, Regenerate and Cancel, the Delete count texts, Delete, Cancel, and a league read error. 3 tests passed before the code: no regenerate button and no Delete button for a new team, and no Instance change for a new slug. At review, 4 more tests: `fieldHeight`, the Delete row, the `destructive-outline` render, and its contrast pair. Full suite: 896 tests pass. Lint, format check, type check, and `npm run build` pass. I did not run the real app.
- **Decisions made:** choices 7 and 8 of Task 119, agreed by the user. Claude choices:
  - With a name that gives no slug, the button is disabled, and its hint says "Enter a team name with at least one letter or number."
  - One league: "1 league uses this team. It keeps its own copy, but loses its Location."
  - With no league, the confirm shows the title only, as US-09.4 says.
  - ~~"Delete team" uses the destructive look, at the left of the drawer buttons.~~ Changed at review by the user: `sm` buttons, and "Delete team" in the new `destructive-outline` look, in a row below "Cancel" and "Save", at the right.
  - The count opens the leagues at the same time, not one by one.
  - At review: the `--field-height` token, the fixed `Input` line height, the `fieldHeight` icon button option, and the `destructive-outline` variant, in `design-system/`.
- **What is left, what is next:** Task 169 holds the technical debt of the fixed `Input` line height. A restore of a deleted Blueprint stays parked (§11). Task 168 adds the import confirm.
