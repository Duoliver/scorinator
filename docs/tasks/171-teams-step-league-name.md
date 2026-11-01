# Task 171: the league name on the wizard Teams step: one font step larger, and bold

**Status:** Done

## Goal

Make the league name at the top of the wizard Teams step easier to see. The user asked for it at the review of Task 120.

## Acceptance criteria

The user gave these criteria with the request on 2026-10-30.

- [x] The league name uses `--font-size-xl`, two steps above `--font-size-md` (changed at review).
- [x] The league name uses the text colour of the Review step title, `--color-fg` (added at review).
- [x] The league name is bold.
- [x] Nothing else on the step changes.
- [x] `npm run lint`, `npm run format:check`, `npm run type-check`, and `npm test` pass.

**Out of scope:** the settings chips next to the name. The Review step title.

## Notes

- **2026-10-30:** The name is `.leagueName` in `TeamsStep.module.css`, with `--font-size-md` (13 px) and the muted colour of `.summary`.

- **2026-10-30 (review):** The user asked for one more font step (`--font-size-xl`, 15 px) and the dark text colour of the Review step title (`--color-fg`), in place of the muted summary grey.

## Report

- **What was built:** `.leagueName` in `TeamsStep.module.css` uses `--font-size-xl` (15 px) in place of `--font-size-md` (13 px), `font-weight: 700`, and `--color-fg`.
- **Test approach:** no new test: the test setup cannot read the CSS module values. A WebKit screenshot shows the larger bold name. Full suite: 915 tests pass. Lint, format check, type check, and `npm run build` pass.
- **Decisions made:** at review, the user chose `--font-size-xl` and `--color-fg`.
- **What is left, what is next:** nothing.
