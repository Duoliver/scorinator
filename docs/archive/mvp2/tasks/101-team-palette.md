# Task 101: more team colours, and two blues that are easier to tell apart

**Status:** Done (2026-10-28)

## Goal

Change the team colour palette: add colours such as lime, and make Sky Blue and Blue easier to tell apart. Feature #6 of `docs/unplanned-features-draft.md`. The result is a spec edit of MVP1 §1 Team Colours and a story for the design-system build task.

## Acceptance criteria

- [x] The task file lists the new palette: names and hex values, agreed with the user.
- [x] Each pair of palette colours is easy to tell apart, by a measurable rule that a test checks.
- [x] The story says what happens to a team whose colour leaves the palette, if any.
- [x] A spec edit happens only with the user's OK.
- [x] The user agrees the story, and its status becomes Agreed.

## Notes

- **2026-10-28:** Task created by the user. The user's draft: "more colours (such as lime, maroon) and differentiate both light blues". Maroon already exists (#7B1E1E). The two close blues are Sky Blue #039BE5 and Blue #1E88E5 (MVP1 spec §1 Team Colours). The palette lives in one place: `src/design-system/tokens/teamPalette.ts`.
- **2026-10-28:** Facts from the code. `src/design-system/tokens/teamPalette.ts` holds 16 entries. A team stores its hex value, so a palette change does not recolour a team: its old colour matches no swatch. `SwatchPicker` shows 8 columns, so 16 colours make 2 rows. No text sits on a swatch, so the AAA text contrast test does not apply. Claude changed criterion 2 to a measurable distance rule.
- **2026-10-28:** Claude measured the colour distance (CIEDE2000, ΔE) of each pair. Current palette: Sky Blue / Blue 7.6, Orange / Gold 9.1, Navy / Purple 13.2. A proposed palette of 24 (3 rows of 8) with 8 new colours, a lighter Sky Blue, a darker Blue, and small Orange and Gold changes has a smallest ΔE of 12.5 (Gold / Yellow, Orange / Coral).
- **2026-10-28:** The user agreed the criteria. Answers: the 24-colour proposal. A team keeps its old hex, with no map. The ΔE ≥ 12 test is parked in `scorinator-future-features.md` §13.
- **2026-10-28:** Claude wrote US-09.7 in epic 09, with the status Refined.

- **2026-10-28:** The user asked if a custom hex field with a preview was planned before. Claude found it: MVP1 Task 34 moved the hex field, the live preview, and the RGB sliders to MVP3 (`scorinator-mvp3.md` §1, §2, Open Items). The user kept it as MVP3.
- **2026-10-28:** The user agreed US-09.7, the order by hue, and the spec edit. Status: Agreed. Claude edited `docs/scorinator-mvp1.md` §1 Team Colours: 24 colours and the new table.

## Report

- **What was built:** US-09.7 (Agreed) in `docs/user-stories/mvp2/09-teams-module.md`: a palette of 24 colours, with two blues that are easier to tell apart.
- **Test approach:** none, no code changed. The build task changes the count test from 16 to 24. The ΔE test is parked (§13).
- **Decisions made:** the 24-colour palette, the old hex kept with no map, the order by hue, and the custom colour kept as MVP3. All in the `PROGRESS.md` Decisions log on 2026-10-28.
- **Spec edit:** `docs/scorinator-mvp1.md` §1 Team Colours, with the user's OK, marked with its date and Task 101.
- **Parked:** `docs/scorinator-future-features.md` §13, a colour distance test.
- **What is left, what is next:** nothing. Next is Task 102, the Standings display epic.
