# Epic 15: Teams module

Source: [`docs/scorinator-mvp3.md`](/docs/scorinator-mvp3.md) §0 Scope, §1 Teams module. Refined in [Task 198](/docs/tasks/198-refine-teams-module.md), from the user's answers in four rounds (2026-11-12). The user agreed all stories on 2026-11-12.

Items: C36, C44 (Must), C7 (Should), from [Task 195](/docs/tasks/195-mvp3-scope.md). C11 and C12 (Could) have no stories: the user did not ask for them (2026-11-12).

**Terms used in this file:**

- **Collection:** a named group of Blueprints. The user decides what a collection is for.
- **"Add teams" dialog:** the dialog of the wizard Teams step (`PickerDialog`, Task 113). The Season league wizard uses it too (US-13.5).

Parked: descriptions for entities (`scorinator-future-features.md` §34), a filter and a sort on the Teams screen (§35), a collection column in the team CSV (§36), pages for the collections list (§37), more fields in the team searches (§38), a new collection from the Collections modal (§39).

---

### US-15.1: create, rename, and disband a collection

**Status:** Agreed
**Spec:** `docs/scorinator-mvp3.md` §1 Teams module (C36), `scorinator-future-features.md` §21

As a user, I want to create collections of teams, so that I find teams faster, to edit them or to add them to a league or a Season.

**Acceptance criteria:**

- [ ] The user creates a collection with a name. The name is required.
- [ ] Two collections cannot have the same name.
- [ ] The user renames a collection. The name stays unique.
- [ ] The user disbands a collection, after a confirm. Its teams stay.
- [ ] A collection gets a permanent UUID and the provenance fields when it is created (US-11.1).
- [ ] A collection can be empty.
- [ ] A Blueprint delete removes the team from each of its collections (US-09.4).

**Out of scope:** a description (§34).

**Notes:** answers of rounds 1 and 2. The UUID follows the MVP2 identity rule: every exportable entity has one. An empty collection, the confirm on a disband, and the removal on a Blueprint delete are Claude choices. The user agreed them on 2026-11-12.

---

### US-15.2: add and remove the teams of a collection

**Status:** Agreed
**Spec:** `docs/scorinator-mvp3.md` §1 Teams module (C36)

As a user, I want to put teams into collections, and take them out, so that each collection holds the teams I want.

**Acceptance criteria:**

- [ ] One team can be in more than one collection.
- [ ] The Blueprint drawer has a "Collections" field. It opens a "Collections" modal, in the style of the "Add teams" dialog.
- [ ] The "Collections" modal lists the collections, with a search on the name. The user selects and clears collections. The selected collections look different from the others.
- [ ] The collection detail adds teams to the collection, and removes them.
- [ ] A team is in one collection once at most.

**Out of scope:** a new collection from the "Collections" modal (§39).

**Notes:** answers of rounds 1 to 3.

---

### US-15.3: the Teams and Collections tabs

**Status:** Agreed
**Spec:** `docs/scorinator-mvp3.md` §1 Teams module (C36)

As a user, I want the Teams screen to show my teams and my collections in two tabs, so that I can work on each one.

**Acceptance criteria:**

- [ ] The Teams screen has two tabs: "Teams", with the list of Blueprints, and "Collections", with the list of collections.
- [ ] The "Collections" tab lists each collection with its name and its team count.
- [ ] A collection opens its collection detail: its name, its teams, and the actions of US-15.1 and US-15.2.

**Out of scope:** pages for the teams list (US-15.8). Pages for the collections list (§37).

**Notes:** answers of rounds 2 and 3. The team count and the content of the detail are Claude choices. The user agreed them on 2026-11-12.

---

### US-15.4: collections in the "Add teams" dialog

**Status:** Agreed
**Spec:** `docs/scorinator-mvp3.md` §1 Teams module (C36)

As a user, I want to use my collections when I add teams to a league, so that I add a known group of teams fast.

**Acceptance criteria:**

- [ ] The "Add teams" dialog can show only the teams of one collection.
- [ ] The "Add teams" dialog can add all the teams of one collection at once.
- [ ] A team that is in the league already does not go in again, as with the slug list (US-08.7).
- [ ] The dialog that adds teams to the Season roster (US-13.4) has the same two collection actions.
- [ ] The Season "Teams" tab does not group its roster by collection.

**Notes:** answers of rounds 1 to 3.

---

### US-15.5: collections in the files

**Status:** Agreed
**Spec:** `docs/scorinator-mvp3.md` §1 Teams module (C36), `docs/scorinator-mvp2.md` §1 Identity

As a user, I want my collections to go into my exports, so that I keep them, or share them.

**Acceptance criteria:**

- [ ] "Export all team blueprints" (US-10.2) writes every collection, with its UUID, its name, and the UUIDs of its teams.
- [ ] The database export and import carry the collections (US-10.4).
- [ ] An import of an unknown collection adds it. A known UUID with the same content imports nothing. A known UUID with other content is a conflict, with "Skip" or "Import as new" (US-11.2).
- [ ] An imported collection with the name of a local collection gets a number after the name: "Europe (2)", as a Season does (US-13.11).
- [ ] An imported collection keeps only the teams that are in the database after the import.
- [ ] The team CSV has no collection column (§36).

**Notes:** answers of rounds 1 and 2. The "(2)" rule from US-13.11, and the teams that exist after the import, are Claude choices. The user agreed them on 2026-11-12.

---

### US-15.6: search the Teams screen

**Status:** Agreed
**Spec:** `docs/scorinator-mvp3.md` §1 Teams module (C44)

As a user, I want to search my teams, so that I find one team in a long list.

**Acceptance criteria:**

- [ ] The "Teams" tab has a search field.
- [ ] The search matches the name and the Location, as the "Add teams" search does today. It ignores case.
- [ ] The list shows only the teams that match. An empty field shows all teams.
- [ ] Every team search matches the same fields: the Teams tab, the "Add teams" dialog, and the Season roster dialog.

**Out of scope:** a filter and a sort (§35). A search on the slug, the trigrams, or the collection names (§38).

**Notes:** answers of rounds 1 to 3. Round 3 replaces the round 1 answer "all the fields": every team search stays on the name and the Location.

---

### US-15.7: a custom team colour

**Status:** Agreed
**Spec:** `docs/scorinator-mvp3.md` §1 Teams module (C7, Should)

As a user, I want to pick any colour for a team, so that a team can have its real colour.

**Acceptance criteria:**

- [ ] The colour field of the drawer opens a "Colour" modal.
- [ ] The modal has three rows:
  1. The current colour, and the selected colour.
  2. The palette swatches (US-09.7).
  3. The custom colour: a hex field and three RGB sliders.
- [ ] A swatch, the hex field, and the sliders stay in sync. Each change shows at once as the selected colour.
- [ ] "OK" sets the selected colour on the team. "Cancel" keeps the current colour.
- [ ] The Blueprint drawer and the Edit drawer of a league team both open the modal.
- [ ] The app does not check a custom colour: no contrast check, no check against the other teams.
- [ ] `design-system/` gets a `Slider` primitive.

**Notes:** answers of rounds 1 and 3. The colour is a hex value already, so no field changes. The palette moves from the drawer into the modal. Round 3 settles the spec open item on the picker layout. The user approved the spec edit (`scorinator-mvp3.md` §1, 2026-11-12).

---

### US-15.8: pages for the teams list

**Status:** Agreed
**Spec:** `docs/scorinator-mvp3.md` §1 Teams module

As a user, I want the teams list in pages, so that a long list stays easy to read.

**Acceptance criteria:**

- [ ] The "Teams" tab shows the Blueprints in pages of 20.
- [ ] The page controls have "Previous", "Next", and the page numbers.
- [ ] The search (US-15.6) looks through all the Blueprints. Its results show in pages of 20 too.
- [ ] A new search goes back to page 1.
- [ ] With 20 Blueprints or fewer, the page controls do not show.

**Notes:** answers of rounds 3 and 4. A new story, not in the spec yet. Back to page 1 on a new search, and no controls for one page, are Claude choices. The user agreed them on 2026-11-12.
