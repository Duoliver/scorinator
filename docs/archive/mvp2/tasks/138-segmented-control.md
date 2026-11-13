# Task 138: segmented control

**Status:** Done (2026-11-03)

## Goal

Add a `SegmentedControl` primitive to `design-system/`: a row of joined buttons, with one of them selected. The wizard uses it for "Tiebreak method" and "Tie format" (Task 140, US-03.2, US-04.1). The import conflict dialog uses it for "Skip" or "Import as new" on each row (Task 149, US-11.2). No screen uses it in this task.

## Acceptance criteria

- [x] `design-system/components/SegmentedControl/`, with `SegmentedControl.tsx`, `.module.css`, `.test.tsx`, `types.ts`, and `package.json`, as `DESIGN_SYSTEM.md` says. It is exported from `@/design-system`.
- [x] Props: `options` (`{ value, label }[]`), `defaultValue`, `onChange`, `label`, `hideLabel`, and `disabled`. The value type is generic: `T extends string`.
- [x] It is a field primitive: it calls `useFieldHandle`, and gives its caller a `FieldHandle<T>` ref (`getValue`, `setValue`, `subscribe`, `focus`).
- [x] A click selects an option and calls `onChange`. A click on the selected option does nothing.
- [x] The control is a `radiogroup`, and each option is a `radio` with `aria-checked`. The label names the group, also when `hideLabel` hides it from view.
- [x] Only the selected option is a Tab stop. The arrow keys move to the next or the previous option and select it, and wrap at the ends. Home and End go to the first and the last option.
- [x] With `disabled`, no option reacts, and each option is disabled.
- [x] The look follows the handoff: joined buttons in one border, condensed uppercase text, the selected option in the accent colour, and a small uppercase label above. The sizes come from tokens (see Notes).
- [x] Testing Library tests for each row above. No snapshot test.
- [x] Type check, lint, Prettier, and the full test suite pass.
- [x] The user checks the look in the real app.

## Out of scope

- The wizard settings (Task 140) and the conflict dialog (Task 149).
- A disabled state for one option only. No story needs it.
- A change to `Tabs`. It looks the same, but it is a tab list with panels, not a choice of value.

## Notes

- **2026-11-03:** Facts from the handoff (`Footballer - League Setup Wizard.dc.html`, lines 126 to 139). Two joined buttons in a 2px border, a 2px line between them, padding 8px 14px, condensed bold uppercase text at 12px, the selected one in the accent colour. A label above in condensed bold uppercase at 11px. The File Manager conflict rows use two separate bordered buttons for Skip and Import as new. Task 96 chose a segmented choice there.
- **2026-11-03:** Token mapping (`DESIGN_SYSTEM.md`: round to the nearest step, a tie rounds up). Text 12px is `--font-size-sm`. The label 11px is `--font-size-xs`. Padding 8px is `--space-2`. Padding 14px is halfway between `--space-3` (12px) and `--space-4` (16px), so it rounds up to `--space-4`. The borders use `--border-width`.
- **2026-11-03:** Facts from the code. `Tabs` has the same look, with `role="tablist"`, and uses `useFieldHandle`. No primitive has arrow-key focus moves yet. `DropdownMenu` (Task 127) moves the focus with the arrow keys inside its menu.
- **2026-11-03:** Proposed choices, for the user to agree before the work starts:

  | # | Choice | Effect | Undo cost |
  |---|---|---|---|
  | 1 | A field primitive with `useFieldHandle`, uncontrolled with `defaultValue`, like `Tabs` and `Select`. | The same ref API as the other fields. | Low |
  | 2 | A generic value type, `T extends string`. | `'single-match'` or a Task 184 constant types the value, not a plain `string`. | Low |
  | 3 ⚠ | The WAI-ARIA radio group pattern: one Tab stop, and the arrow keys move and select. | A keyboard user changes the choice with the arrows, not with Tab. | Low |
  | 4 | A `label` prop is always given. `hideLabel` hides it from view for the conflict rows, which have their label in the row. | A screen reader always hears a name. | Low |
  | 5 ⚠ | 14px padding rounds up to `--space-4` (16px). | Each option is 4px wider than in the handoff. | Low |
  | 6 | The review check is a temporary try-out in a real screen, as for Task 113. It is removed before the commit. | You check it in `npm run tauri:dev`. | Low |

- **2026-11-03:** The user agreed the criteria and choices 1 to 6.

- **2026-11-03:** The tests ran red first (no component), then green. To prove them, I broke the component in four ways: each option a Tab stop, no wrap at the end, `onChange` on a click of the selected option, and no group name with `hideLabel`. Each break fails a test.
- **2026-11-03:** Look check by Claude, in a temporary Vite demo page with headless Chromium. The look matches the handoff. One change: the browser focus ring had round corners. The fields use `--shadow-accent-sm` for the focus, but on the accent fill it merged and hid the group border. The focus is now a light inner ring, as on the selected swatch. Only the selected option takes the focus, so the ring is always on the accent fill. The demo page is deleted.
- **2026-11-03:** TEMPORARY try-out for the user check: four controls at the top of the Teams screen (`src/features/teams/TeamsScreen.tsx`, marked "TEMPORARY (Task 138 try-out)"). Remove it before the commit.
- **2026-11-03:** The user checked the try-out in the real app and agreed that the task is Done. The try-out is removed.

## Report

- **What was built:** `SegmentedControl` in `design-system/components/`, exported from `@/design-system` with `SegmentedControlProps` and `SegmentedOption`. Props: `label`, `options`, `defaultValue`, `onChange`, `hideLabel`, `disabled`. A generic `T extends string`, and a `FieldHandle<T>` ref. No screen uses it yet. Tasks 140 and 149 are the first.
- **Test approach:** 21 new Testing Library tests, 1546 tests in total. They cover the group name with and without `hideLabel`, the click, the ref (`getValue`, `setValue`, `subscribe`, `focus`), one Tab stop, the arrow keys with the wrap, Home and End, and `disabled`. jsdom has no layout, so the look and the focus ring were checked in Chromium.
- **Decisions made:** choices 1 to 6 above, in the `PROGRESS.md` Decisions log on 2026-11-03. The focus ring is in the notes.
- **What is left, what is next:**
  - The user checks the try-out in the real app. Then I remove it and commit.
  - `Tabs` has no focus style of its own, so it shows the browser ring with round corners. A small fix for a later task.
  - Next: Task 139 (bracket state).
