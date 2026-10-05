# Task 34 — decisions log: team colour palette

Calls made while the user narrowed, specified, and approved Task 34. Condensed here from the running Decisions log in `PROGRESS.md` — see that section for the procedure this follows. Oldest entry first.

- **2026-10-05 (scope change):** The user reduced Task 34 to the 16-colour palette only, in MVP1. The hex field, the live preview, and the RGB sliders move to MVP3, and the user still needs to design them. This reverses two earlier calls. First, the palette was MVP3 scope (Task 0, Task 12, and the 2026-09-25 Task 34 entry in `PROGRESS.md`). Second, the sliders were MVP1 scope. The new `Slider` primitive is not needed now. The earlier plan for the hex field and the sliders stays in git history, in the Task 34 row before 2026-10-05.

- **2026-10-05 (MVP3 spec update):** The user asked for an update to `scorinator-mvp3.md`. Team Colours now says that the palette ships in MVP1. MVP3 adds a custom colour: a hex field, a live preview, and RGB sliders. The Team Colours epic now holds the custom colour story, and Open Items lists the pending design. One line is an assumption, not a user call: "The palette stays available in MVP3, next to the custom colour picker." The user can change it after the custom colour design.

- **2026-10-05 (MVP1 spec update):** The user asked for the palette in `scorinator-mvp1.md` too. MVP1 §1 has a new Team Colours section with the placeholder palette table, and the Team Management epic has a palette story. The user said to keep the placeholder palette for now, and that the values can change later. So the spec says to keep the values in one place in the code. The table moved from MVP3 to MVP1, and MVP3 now points to MVP1, so only one copy of the values exists. The open item on the final values moved to MVP1 §3.

- **2026-10-05 (stored colour):** The user chose to store the hex value, not the palette entry. `TeamRecord`, CSV, and save files do not change, and MVP3's custom colour fits the same field. The cost: a palette change leaves old teams on their old colours, and the picker then shows no swatch selected for them.

- **2026-10-05 (default colour and hex case):** The user chose White as the colour of a new team. The reasons: white is the traditional colour of an away kit, and it is probably the cheapest kit to make. `teamPalette.ts` exports it as `DEFAULT_TEAM_COLOUR`, so a palette change also covers the default. The user also chose to ignore case when a stored hex value is matched against the palette.

- **2026-10-05 (build calls, not asked):**
  - The palette lives in `design-system/tokens/teamPalette.ts`, because only `design-system/` reads the design brief. No CSS variable and no `tokens.ts` mirror hold it, because a swatch gets its colour from data at runtime.
  - The palette tests check rules, not values (16 entries, valid hex, unique names and values, default in the palette). A palette change then needs no test change. This departs from `tdd.md`, which says a spec table row is a test case. The reason: the user said the values can change.
  - `SwatchPicker` is generic. It takes `{ label, value }` options and knows nothing about teams, the same way `Select` does. Its markup was a `fieldset` with a `legend` and one native radio for each option, so the arrow keys work with no extra code. See the review entry below for the change to a `radiogroup`.
  - An edit of a team with an empty colour (a CSV row with a blank `Colour`) keeps the empty colour until the user picks a swatch. Only a new team gets the default.

- **2026-10-05 (review — ring and layout fix):** The user chose a white inner ring for the selected swatch, from three options (an inner ring, a tick, the hard offset shadow). The user also reported extra space under the picker that went away on a hover. The cause was a WebKitGTK `fieldset`/`legend` layout bug, not `TeamFormDrawer`. The picker group is now a `div` with `role="radiogroup"`. Do not change it back to a `fieldset`. See the report for the measurements.
