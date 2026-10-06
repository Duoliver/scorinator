# Task 34 — Team colour palette

**Status:** Done — 2026-10-05 (review closed by the user)

## What was built

The team form now has a 16-swatch colour picker in place of the hex text field. It shows in the New team and Edit team drawers, on the Teams screen and on the League Setup Teams step.

- `design-system/tokens/teamPalette.ts` holds `TEAM_PALETTE` (16 `{ name, hex }` entries, the placeholder values from MVP1 spec §1) and `DEFAULT_TEAM_COLOUR` (White). This is the one place to change the palette.
- `design-system/components/SwatchPicker` is a new generic primitive. It uses the `FieldHandle<string>` pattern (`getValue`, `setValue`, `subscribe`, `focus`). It renders a `div` with `role="radiogroup"` and one hidden native radio for each colour, under a grid of 8 square swatches. The selected swatch has a heavy accent border with a white ring inside it, and keyboard focus shows the accent shadow. The match against the options ignores case. A value that matches no option is kept, and no swatch shows as selected.
- `TeamForm` uses `SwatchPicker` with the palette. A new team starts on White. An edited team starts on its stored colour.
- `DESIGN_SYSTEM.md` has a new section about the palette file.

`TeamRecord`, CSV, JSON, save files, and the swatches on other screens did not change. They show the stored hex value.

## Test approach

- `teamPalette.test.ts` (6 unit tests): 16 entries, valid 6-digit hex, non-blank and unique names, unique hex values ignoring case, the default is in the palette. The tests do not check the values, so a palette change needs no test change.
- `SwatchPicker.test.tsx` (16 tests): radiogroup name, one radio for each option, `defaultValue` match and case, an off-palette value, a click, `onChange`, the arrow keys, `setValue`, `subscribe` and unsubscribe, `focus()` with and without a checked swatch, and two pickers on one page.
- `TeamForm.test.tsx` (5 new or changed tests): one swatch for each palette colour, White checked for a new team, pre-fill on edit, a click on `Gold` saves `#F9A825`, the default saves when the user picks nothing, an off-palette colour and an empty colour stay unchanged on save.

`type-check` and `lint` are clean. The full suite passes: 533 tests in 54 files (506 before).

**Browser check:** the sandbox has no display. A headless Chromium (Playwright) opened the Teams screen on the Vite dev server, and so did WebKitGTK under Xvfb, for the review fixes. The New team drawer showed the 16 swatches in two rows of 8, with White selected. A click on Navy and then the right arrow key selected Blue and showed the focus shadow. The Tauri app itself was not run.

## Decisions made

See [`decisions-log/034-team-colour-palette.md`](/decisions-log/034-team-colour-palette.md).

## Review fixes (2026-10-05)

- **Selected swatch was hard to see.** The prototype marks it with a 3px dark green border only, which looks almost the same as the 2px near-black border of the other swatches. The user chose a white inner ring (`inset` box shadow in `--color-surface`, `--border-width` wide). A focused, selected swatch keeps the ring and the focus shadow. On the White swatch the ring does not show, so only the green border marks it.
- **Extra space under the picker, gone on a hover.** The user saw it in the Tauri app. It happened in WebKitGTK 2.52.6, the engine Tauri uses on Linux, and not in Chromium or Playwright WebKit. Measured in WebKitGTK under Xvfb: on the first layout, the `fieldset` was 126.3px high, not 104.3px, so the legend height (22px) counted twice. A pointer hover on the Create team button forced a new layout and fixed it. Cause: WebKitGTK lays out a `fieldset` with a `legend` wrongly the first time, inside the drawer's flex column. `TeamFormDrawer` had no fault. Fix: the group is now a `div` with `role="radiogroup"` and `aria-labelledby` on a `span`, in a flex column with `--space-2` gap. Measured again: 104.3px from the first layout, unchanged after the hover. Tests now look for the `radiogroup` role.

## What is left, what is next

- The 16 placeholder values are not final. A later design pass can change them in `teamPalette.ts`.
- MVP3: the custom colour (hex field, live preview, RGB sliders) and the `Slider` primitive wait for the user's design.
