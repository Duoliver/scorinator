# Task 113: Picker dialog: search, multi-select and single-select

**Status:** Done

## Goal

Add the `design-system/` dialogs that pick items from a list, on top of `Modal` (Task 112). The wizard "Add teams" dialog (US-08.1, Task 120) and the Switch dialog (US-08.5, Task 121) use `PickerDialog`. The File screen import list (US-10.3, Task 149) uses `ChecklistDialog`. No screen uses them in this task.

## Acceptance criteria

The user agreed these criteria and the five choices below on 2026-10-29.

**`PickerDialog`, multi mode (US-08.1):**

- [x] An `lg` `Modal` with a title, a line under it, and a ✕, as the handoff "Add teams".
- [x] A search field above two panels: "Available" and "Selected (N)". Focus starts in the search field.
- [x] The search filters "Available" by each item's search text. It ignores case.
- [x] A click on an "Available" item adds it to the selection, at the end. The item leaves "Available".
- [x] Each "Selected" item has a ✕ that takes it out of the selection. It comes back to "Available".
- [x] An optional action under "Available", for example "+ Create new team".
- [x] "Cancel" and a confirm button with the caller's label, for example "Add 4 teams". The confirm button is disabled with no selection.

**`PickerDialog`, single mode (US-08.5):**

- [x] The same dialog, with the right panel "Currently in slot", which shows the current item with no ✕.
- [x] A click on an "Available" item calls `onPick` with its id. The caller closes the dialog.
- [x] The text "Pick a replacement from Available — this closes the dialog right away." No confirm and no "Cancel" button. Escape, the ✕, and a backdrop click cancel.

**`ChecklistDialog` (US-10.3):**

- [x] A `md` `Modal` with a title, a line under it, and one checkbox row for each item. All rows start checked.
- [x] "Cancel", and a confirm button with the caller's label, for example "Import selected". The confirm button is disabled with no row checked, and gives the checked ids in list order.

**Both:**

- [x] The design system knows no team. An item is an id, a search text, and the content the caller renders.
- [x] `Modal` gets a third size, `md` (30rem, the handoff File Manager picker).
- [x] Testing Library tests for each criterion. Both are in the `design-system` barrel.
- [x] `npm run lint`, `npm run format:check`, `npm run type-check`, and `npm test` pass.

**Out of scope:** the team rows (swatch, Location, Tier), the inline create drawer, and the OVR roll (Tasks 120, 121). The conflict tag, the import, and the "Resolve conflicts" dialog (Tasks 144, 149).

## Notes

- **2026-10-29:** Facts from the handoff. `League Setup Wizard` has one dialog for Add and Switch: a ✕, a search field, "Available" and "Selected (N)" or "Currently in slot", "+ Create new team" under "Available", and "Cancel" with "Add N teams" in Add mode only. An "Available" row is a button with a swatch and a name. It has no checkbox. `File Manager` has the import picker: max 480px wide, "Found 5 in the file. Choose which to import.", checkbox rows with a name, a UUID, and a "Conflict" tag, then "Cancel" and "Import selected".
- **2026-10-29:** The user agreed choice 1, so US-08.1 now says "A click on a row moves it to the selected teams … The rows have no checkbox (Task 113)."
- **2026-10-29:** Claude applied a temporary try-out to `TeamsScreen.tsx`, marked "TEMPORARY (Task 113 try-out)". It is not part of the task. The user tried the three dialogs in the real app and reported that they work. Claude then removed the try-out.
- **2026-10-29 (review):** The user asked for a checklist row that is clickable on its whole width, with a hover colour. `Checkbox` has a new `fullWidth` option: the label fills the row, with the padding and a `--color-bg` hover. `ChecklistDialog` uses it. One new test.

## Choices for discussion

| # | Choice | Effect | Undo cost |
|---|---|---|---|
| ⚠ 1 | The team picker follows the handoff: a click moves a row to "Selected". The rows have no checkbox. US-08.1 says "a checkbox", so its text changes. | The selection shows in the "Selected" panel, not as ticks. | Medium |
| 2 | The caller holds the selection. The search stays inside the dialog. | A team made with "+ Create new team" can join the selection (US-08.1). | Medium |
| 3 | An item is an id, a search text, and content that the caller renders. | The team row look stays in `features/` (Task 120). | Low |
| 4 | The import list is a second dialog, `ChecklistDialog`, not a mode of `PickerDialog`. | Two simpler dialogs, as the handoff has two layouts. | Low |
| 5 | `Modal` gets a third size, `md` (30rem). | The import list matches the handoff width. | Low |

## Report

- **What was built:** `PickerDialog` (multi and single mode, the search, "Available" with an optional action, "Selected (N)" or "Currently in slot") and `ChecklistDialog` (checkbox rows, all checked at start, the confirm with the checked ids). `Modal` has a third size, `md`. `Input` takes an `aria-label`, for the search field. `Checkbox` takes rich label content, for a row with a tag, and a `fullWidth` option, for a row that is clickable on its whole width. All in the `design-system` barrel.
- **Test approach:** Testing Library tests, 23 new: 12 for multi mode, 5 for single mode, 6 for `ChecklistDialog`. They cover the search with no regard to case, "No match.", the order of selection, ✕, the disabled confirm, the cancel paths, the optional action, the item content, and the checked ids in list order. Full suite: 758 tests pass. Lint, format check, type check, and `npm run build` pass. The user checked the look in the real app with a temporary try-out.
- **Decisions made:** the five choices above, agreed by the user. Claude choices: a row button takes the item label as its accessible name. The search field has the placeholder "Search by name…", as the handoff, and the name "Search". "No match." shows only for a search with no result. The rows use a 2px line in `--color-bg`, because no divider token exists.
- **What is left, what is next:** the user asked for a later restyle of the picker rows: new Task 165, after Task 120. No screen uses the dialogs yet. Tasks 120 and 121 use `PickerDialog`. Task 149 uses `ChecklistDialog`, with the "Conflict" tag.

