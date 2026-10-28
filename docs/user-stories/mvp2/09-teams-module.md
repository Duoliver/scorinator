# Epic 09: Teams Module (Blueprints)

Source: [`docs/scorinator-mvp2.md`](/docs/scorinator-mvp2.md) §1 Teams Module (Blueprints), §2 Epic: Teams Module (Blueprints). Layout reference: the MVP2 handoff, `Footballer - Teams` and `Footballer - League Setup Wizard` (Teams step).

US-09.1 and US-09.2 are the two spec stories, refined in [Task 94](/docs/tasks/094-refine-teams-module.md). US-09.3 comes from [Task 99](/docs/tasks/099-team-location-label.md). US-09.4 and US-09.5 are new in Task 94. US-09.6 comes from [Task 100](/docs/tasks/100-team-trigrams.md).

**Terms used in this file:**

- **Blueprint:** a reusable team in the Teams module: name, colour, base Tier, slug, Location (US-09.3), and a UUID (epic 11).
- **Instance:** the state of one team in one league: name, colour, slug, Tier, and OVR, with a link to its Blueprint (US-08.4, Task 81).

---

### US-09.1: a global list of team Blueprints

**Status:** Agreed
**Spec:** `docs/scorinator-mvp2.md` §1 Teams Module (Blueprints), §2 Teams Module

As a user, I want a global "Teams" list of reusable Blueprints, separate from any one league, so that I can build a roster once and use it across multiple competitions.

**Acceptance criteria:**

- [ ] The Teams module lists every Blueprint: the colour swatch, the name, the Location (US-09.3), the slug, and the base Tier, as in MVP1 and the handoff.
- [ ] "+ Create new team" opens the team drawer: "Team name", "Location", "Colour", and "Tier". The slug shows as a preview made from the name.
- [ ] A new slug is unique: a second Blueprint with the same name gets `-2`, a third gets `-3` (Task 75).
- [ ] "Save" creates the Blueprint with a new UUID (epic 11).
- [ ] A click on a row opens the same drawer to edit the Blueprint. The slug stays fixed (US-09.5).
- [ ] A Blueprint edit changes the Blueprint only. No league Instance changes, except the Location tooltip, which reads the Blueprint (US-09.2, US-09.3).
- [ ] A Blueprint belongs to no league. One Blueprint can be in many leagues, with one Instance in each.
- [ ] The team CSV import and export work on Blueprints, with the Task 75 slug match and the optional Location column (US-09.3).
- [ ] A Blueprint has no City and no Crest (Task 74).

**Out of scope:** City and Crest (MVP3). The JSON export and import of all Blueprints (epic 10). The UUID and provenance rules (epic 11).

**Notes:** the list layout follows MVP1, because the handoff Teams screen has the same visible text (Task 83).

---

### US-09.2: each league keeps its own team state

**Status:** Agreed
**Spec:** `docs/scorinator-mvp2.md` §1 Teams Module (Blueprints), Team Selection in League Setup, §2 Teams Module

As a user, I want each league to keep its own live state for a team (OVR, current Tier), apart from the Blueprint, so that a change in one league does not change the Blueprint.

**Acceptance criteria:**

- [ ] When a Blueprint is added to a league, the league gets an Instance. It copies the Blueprint name, colour, slug, and Tier, and gets a rolled OVR (Tasks 81, 93).
- [ ] The Instance keeps the UUID of its Blueprint, also after the Blueprint is deleted (US-09.4).
- [ ] An Instance edit changes only that Instance (US-08.4). The Blueprint and every other league stay the same.
- [ ] A Blueprint edit, a slug regenerate, or a delete changes no Instance (US-09.4, US-09.5).
- [ ] The Location is not copied. A league screen reads it from the Blueprint, while the Blueprint exists (US-09.3).
- [ ] Two leagues with the same Blueprint have two Instances, each with its own rolled OVR.
- [ ] Tests check that an edit on one side leaves the other side the same, in both directions.

**Out of scope:** a shared Instance across the leagues of one Season (MVP3). The per-league export with the Blueprint and Instance snapshots (epic 10).

**Notes:** the slug copy is a Claude choice. The user confirmed it on 2026-10-28. It keeps a slug on the Instance after a delete or a regenerate, for the league slug list export (Task 95). With it, US-08.4 says "the slug copied from the Blueprint at add", in place of "always the Blueprint slug".

---

### US-09.3: a Location label on each team

**Status:** Agreed
**Spec:** `docs/scorinator-mvp2.md` §1 Teams Module (Blueprints), §2 Teams Module. The spec has the story and the field since 2026-10-28 (Task 99), with the user's OK.

As a user, I want to give each team a free-text location, so that I can see where a team comes from when I pick teams and read results.

**Acceptance criteria:**

- [ ] A Team Blueprint has an optional `location` field: a plain string, empty by default.
- [ ] The app trims the value. The field holds 40 characters at most.
- [ ] The location is not part of the slug, and it is not unique: many teams can share one location.
- [ ] A league Instance does not copy the location. Each screen reads it from the Blueprint, so an edit shows in every league at once.
- [ ] The team drawer (create and edit) has a "Location" input after "Team name", marked optional.
- [ ] The Teams module list has a "Location" column after the name. An empty location shows "—".
- [ ] The Select-teams dialog shows the location on each row, after the name, in muted text. The search matches the name or the location.
- [ ] The league setup Teams step shows the location on each team row and in each group column, after the name, in muted text. The Review step team list does the same.
- [ ] In the standings table, the group cards, and the bracket tie cards, a team name with a location shows a tooltip with the location. A keyboard user gets the same tooltip on focus. A team with no location shows no tooltip.
- [ ] The team CSV export writes a fifth column, "Location".
- [ ] The team CSV import finds the "Location" column by its header, as it finds the other columns. A file with no "Location" column still imports.
- [ ] With the Task 75 slug match: a row with a "Location" column sets the location of the Blueprint. A file with no "Location" column leaves the location of an updated Blueprint as it is. A new Blueprint then gets an empty location.
- [ ] The JSON exports (one league, all leagues, all Blueprints, the database) include the location. A JSON file with no location imports with an empty location.
- [ ] The results `.txt` export does not include the location.

**Out of scope:** a City entity, a Region, or any link between teams by location (MVP3). A filter or a sort by location. A location on a league.

**Notes:** the user asked for this story on 2026-10-28 (Task 99). The user approved it as MVP2 scope: a free label, not the MVP3 City. CLAUDE.md and Task 74 keep City as MVP3 scope. What MVP3 does with the label is an Open question in `PROGRESS.md`. The user chose the four display places and the optional CSV column on 2026-10-28. The 40-character limit, the "—" for empty, the muted text, and the 4-column CSV rule are Claude choices. The user confirmed them on 2026-10-28. The tooltip needs a new design-system primitive, because `src/design-system/components/` has no Tooltip. That is a separate build task, before the feature work.

---

### US-09.4: delete a team Blueprint

**Status:** Agreed
**Spec:** `docs/scorinator-mvp2.md` §1 Teams Module (Blueprints), §2 Teams Module. A new story, from Task 94 gap 1. The spec has it since 2026-10-28, with the user's OK.

As a user, I want to delete a team Blueprint I no longer need, so that the Teams list stays short.

**Acceptance criteria:**

- [ ] The edit drawer of a Blueprint has a "Delete team" button.
- [ ] The button opens a confirm: "Delete Ashfield Rovers? 3 leagues use this team. They keep their own copy, but lose its Location." With no league: "Delete Ashfield Rovers?". The buttons are "Cancel" and "Delete".
- [ ] "Cancel" changes nothing. "Delete" removes the Blueprint from the Teams module.
- [ ] Each league keeps its Instances of the deleted Blueprint, with their name, colour, slug, Tier, and OVR (US-09.2). The Location tooltip no longer shows.
- [ ] A deleted Blueprint no longer shows in the Add teams dialog, "Load them all", or a slug list import.
- [ ] Its slug is free again. A new Blueprint can take it.
- [ ] There is no undo.

**Out of scope:** a restore of a deleted Blueprint from a league: parked in `scorinator-future-features.md` §11.

**Notes:** the user chose "delete always" on 2026-10-28 (Task 94 gap 1). The button place and the confirm texts are Claude choices. The user confirmed them on 2026-10-28. The confirm needs the confirm modal primitive (impact review §2.13).

---

### US-09.5: a fixed slug, with a regenerate button

**Status:** Agreed
**Spec:** `docs/scorinator-mvp2.md` §1 Teams Module (Blueprints). A new story, from Task 94 gap 2. The spec has it since 2026-10-28, with the user's OK.

As a user, I want a team slug to stay the same when I rename the team, unless I ask for a new one, so that my CSV files and slug lists keep working.

**Acceptance criteria:**

- [ ] In the create drawer, the slug field follows the name, as a read-only preview with the `-2` rule (Task 75).
- [ ] After the first save, a rename keeps the slug. A rename from a CSV row keeps it too (Task 75).
- [ ] In the edit drawer, the slug field is read only. An icon button sits at the right side of the field, with no visible text.
- [ ] The button shows the hint "Regenerate slug from name" on hover and on keyboard focus.
- [ ] The button has the `aria-label` "Regenerate slug from the team name".
- [ ] The button is disabled when the name gives the same slug. Its hint then says "The slug already matches the name."
- [ ] A click opens a confirm: "Regenerate slug?", with the text "The slug changes from ashfield to ashfield-rovers. CSV files and slug lists with the old slug no longer find this team." The buttons are "Cancel" and "Regenerate".
- [ ] "Regenerate" puts the new slug in the field, with the `-2` rule, not counting the Blueprint itself. The drawer "Save" writes it. The drawer "Cancel" drops it.
- [ ] The new slug changes no league Instance (US-09.2).
- [ ] The slug rule is a pure function, with tests: the same slug for the same name, the suffix, and no clash with the Blueprint itself.

**Out of scope:** a slug typed by hand.

**Notes:** the user chose "fixed at create, with a regenerate button" on 2026-10-28 (Task 94 gap 2), after Claude listed the risks of a slug that follows the name. The user set the button form: an icon, a hover hint, an `aria-label`, and a confirm. The texts and the disabled state are Claude choices. The user confirmed them on 2026-10-28. The button needs an icon-only Button variant and the Tooltip primitive (US-09.3) in `design-system/`.

---

### US-09.6: team trigrams

**Status:** Agreed
**Spec:** `docs/scorinator-mvp2.md` §1 Teams Module (Blueprints), §2 Teams Module. A new story, from [Task 100](/docs/tasks/100-team-trigrams.md). The spec has it since 2026-10-28, with the user's OK.

As a user, I want each team to have a short three-letter code, with alternatives, so that I can tell teams apart where a full name does not fit.

**Acceptance criteria:**

- [ ] A Blueprint has an ordered list of trigrams, for example `ASH AFC ATN`. The list can be empty. It holds 5 trigrams at most.
- [ ] A trigram has exactly 3 characters: uppercase letters A to Z, or digits. The app makes a typed letter uppercase. One list has no duplicates. Two Blueprints can share a trigram.
- [ ] An empty list uses one trigram made from the name: the first three letters or digits, uppercase. "Ashfield Rovers" gives `ASH`. A name with fewer than 3 gives `X` for each missing place, for example "FC" gives `FCX`.
- [ ] The team drawer has a "Trigrams" field after "Team name", with the values split by spaces. With an empty field, the placeholder shows the trigram made from the name.
- [ ] The Teams list has a "Trigrams" column, for example `ASH · AFC`.
- [ ] A league picks one trigram for each team, unique in the league. The teams pick in this order: higher Tier first, then higher OVR, then the fixed lots of Task 78. Each team takes the first trigram of its list that is still free.
- [ ] A team with no free trigram takes its first trigram with the last character changed to a digit, from 2 to 9, the first one that is free. For example `ASH` gives `AS2`. The wizard shows a hint on that row: "No free trigram. Add an alternative to the team."
- [ ] In the wizard, the pick runs again after each add, Switch, Remove, Tier change, or OVR change. The team list shows the picked trigram on each row.
- [ ] The Edit drawer (US-08.4) has a "Trigram" field. A typed trigram is fixed for that team, and must be unique in the league. A fixed trigram is taken before the pick runs. An empty field goes back to the pick.
- [ ] "Create league" stores the picked trigram on each Instance. After that, it does not change. A later Blueprint edit does not change it (US-09.2).
- [ ] A trigram always shows in the mono font, `--font-mono`.
- [ ] The league trigram shows in these places:
  - The standings table and the group cards show the trigram in place of the name when the window is too narrow for the name.
  - Each fixtures row shows the trigram after the name, in muted mono text.
  - The standings chart labels its lines with trigrams (Task 102).
  - The last-5 hover card shows the opponent trigram (Task 102).
- [ ] The team CSV gets an optional "Trigrams" column, with the values split by spaces. A file with no "Trigrams" column keeps the list of an updated Blueprint, as for Location (US-09.3).
- [ ] The Blueprint JSON and the league JSON carry the list. The league JSON also carries the picked trigram of each Instance.
- [ ] The pick is one pure function, with tests: the Tier order, the OVR order, the fixed lots, a fixed trigram, the digit fallback, and the same result for the same input.

**Out of scope:** a trigram in the bracket tie cards and the results `.txt` export. Trigrams longer or shorter than 3 characters.

**Notes:** the user asked for trigrams on 2026-10-28 (Task 100, draft feature #1). The user chose the trigram made from the name, the OVR order for the same Tier, the digit fallback, the display places, the live pick with a fixed store at "Create league", the Edit override, and the A to Z and 0 to 9 format with a spaced CSV column. The limit of 5, the `X` padding, the hint text, and the fixed trigram taken first are Claude choices. The user confirmed them on 2026-10-28.
