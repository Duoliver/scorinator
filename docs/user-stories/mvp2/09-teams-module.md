# Epic 09: Teams Module (Blueprints)

Source: [`docs/scorinator-mvp2.md`](/docs/scorinator-mvp2.md) §1 Teams Module (Blueprints), §2 Epic: Teams Module (Blueprints). Layout reference: the MVP2 handoff, `Footballer - Teams` and `Footballer - League Setup Wizard` (Teams step).

US-09.1 and US-09.2 are the two spec stories. [Task 94](/PROGRESS.md) refines them. US-09.3 comes from [Task 99](/docs/tasks/099-team-location-label.md).

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
