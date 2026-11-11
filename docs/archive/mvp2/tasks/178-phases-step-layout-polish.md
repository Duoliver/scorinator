# Task 178: Phases step layout polish

**Status:** Done

## Goal

Polish the look of the wizard Phases step (Task 129). The user agreed Task 129 as Done, and asked for a later pass on its layout.

## Acceptance criteria

Agreed with the user on 2026-11-11 (rows 1 and 5 to 11 of the talk).

- [x] 1. "Set by" is a `SegmentedControl` with "Group size" and "Group count".
- [x] 5. The ⋮ button of a group row is 22 px (1.375rem), as the handoff.
- [x] 6. The "Set by" change uses `GroupBy`, not a string union.
- [x] 7. A zone row has the swatch and the switch (or the name) in one box. The row aligns to the top, so the switch does not move when its fields show or hide.
- [x] 8. In a card below about 39rem, each zone row shows its fields under the switch. The gap between zone rows is larger than the gap between a switch and its fields. A container query sets this.
- [x] 9. Rows 7 and 8 apply to the zone editor in the wizard and in "Edit zones" in League Detail.
- [x] 10. The format field fills the card width.
- [x] 11. Points 2, 3, and 4 of the first list drop out.
- [x] Tests for rows 1, 5, and 6. A look check in headless Chromium for rows 7, 8, and 10, because jsdom has no layout.
- [x] `npm run lint`, `npm run format:check`, `npm run type-check`, and `npm test` pass.
- [x] The user checks the Phases step, the Teams step groups, and "Edit zones" in the real app.

## Notes

- **2026-11-01:** Task created by User. "We gotta polish the layout later. It is for another day."
- **2026-11-11:** Facts from the code. "Set by" is still a `Select` in `PhaseCard.tsx`, and Task 138 built `SegmentedControl`. Its `onChange` casts to `'size' | 'count'`, not to `GroupBy` (a Task 184 leftover). The ⋮ of a group row is a `DropdownMenu` icon trigger in `GroupCards.tsx`. The hint "A bracket must be the last phase." sits beside "+ Add phase", in one box in `PhasesStep.tsx`.
- **2026-11-11:** The five points of the list came from Claude look checks (Tasks 129, 130), not from the user. The user wrote only "We gotta polish the layout later."
- **2026-11-11:** The user asked for three changes. (a) Zone rows: the swatch and the switch in one box, and the row aligned to the top, so the switch stays in place when the fields show or hide. (b) In a narrow card, when the fields wrap under the switch, a larger gap between zone rows than between a switch and its own fields. (c) The format field fills the card width. The user agreed points 1 and 6, and "2", which can be a typo for 5.
- **2026-11-11:** The user agreed all 11 rows: 1, 5, and 6 of the first list, and 7 to 11 for the new points.
- **2026-11-11:** Built. Look check: a temporary demo page in Vite, opened in the headless Chromium shell, with the cards at 58rem and 34rem. Wide: the switch stays at the top of its row, beside the From and To labels. Narrow: each row shows its fields under the switch, 8 px below it, with 24 px between rows. The format field fills the card. The demo page is deleted.
- **2026-11-11 (review):** The user asked to align the "Set by" row. The segmented control is 32 px high, the number field 46 px, and the row aligned to the bottom, so the "Set by" label sat 15 px lower. The row now aligns to the top: the two labels share one line, and the two boxes share a top edge. The other field row keeps its bottom line. Checked again in headless Chromium.
- **2026-11-11 (review):** The user asked for the segmented control label at the size of the `Input` label: `--font-size-sm`, not `--font-size-xs`, for a bold uppercase label. `SegmentedControl.module.css` changes, so the bracket settings labels grow too. The conflict dialog hides its label. `DESIGN_SYSTEM.md` gets the rule. The `Table` header row and the `PickerDialog` panel title stay `xs`: they are inverted header bands, not field labels.
- **2026-11-11 (review):** The user asked for the zone label fields to take the rest of the row. The fields box grows (`flex: 1`), and the label field takes the rest from 15rem up. In the narrow layout the fields box stretches to the full width. Checked in headless Chromium at 58rem and 34rem.

## Report

- **What was built:** "Set by" is a `SegmentedControl`, and `setGroupBy` takes `GroupBy`. `Button` has a new size `icon-sm` (1.375rem), and `DropdownMenu` a new `compact` option, off by default, which the group row ⋮ uses. `ZoneEditor` puts the swatch and the name or switch in one `lead` box, aligns its rows to the top, and stacks each row below 39rem with a container query. The format field fills the card. At review, the "Set by" row aligns to the top, the segmented control label is `--font-size-sm`, and the zone label fields take the rest of the row.
- **Test approach:** 3 new tests, written first and seen to fail: the `compact` menu trigger, the group row ⋮, and the `icon-sm` button. 3 tests changed from the `Select` to the radios of "Set by", 2 in the Phases step and 1 in the smoke test. The zone and format layout has no unit test, because jsdom has no layout. The headless look check covers it. Full suite: 2059 tests pass. Lint, format check, and type check pass.
- **Decisions made:** rows 1, 5 to 11, agreed by the user. Claude choices: the size name `icon-sm`, the `compact` prop, and an outer `container` box in `ZoneEditor`, because a container query cannot change the gap of its own container.
- **What is left, what is next:** the "Edit zones" drawer is 26.25rem wide, so it always shows the stacked rows. The group row ⋮ is also 22 px in League Detail, because `GroupCards` is shared. Next is Task 179.
