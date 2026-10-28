# Epic 11: Identity & Provenance

Refined in [Task 96](/docs/tasks/096-refine-identity-provenance.md). Source: [`docs/scorinator-mvp2.md`](/docs/scorinator-mvp2.md) §1 Identity & Provenance System, §2 Epic: Identity & Provenance. Layout reference: the MVP2 handoff, `Footballer - File Manager` (the "Resolve conflicts" dialog).

**Terms used in this file:**

- **Entity:** a Team Blueprint or a League in MVP2. Seasons and Locations arrive in MVP3.
- **Known UUID:** a UUID that already exists in the local database.
- **Same content:** every field of the incoming entity is equal to the local one, except the provenance fields.

---

### US-11.1: a permanent identity

**Status:** Agreed
**Spec:** `docs/scorinator-mvp2.md` §1 Identity & Provenance System, §2 Identity & Provenance

As a user, I want every team/league/location to keep the same permanent identity no matter how many times it's exported and re-imported, so that re-sharing data doesn't create confusing duplicates.

**Acceptance criteria:**

- [ ] `engine/identity` makes a UUID v4 from an injected source (`ENGINE.md`). Tests use a fixed source, so they are reproducible.
- [ ] A Blueprint gets its UUID when it is created: in the team drawer, in the add dialog, or from a new CSV row (Task 75).
- [ ] A league gets its UUID at "Create league" (US-08.8).
- [ ] An Instance has no UUID of its own. It keeps the UUID of its Blueprint (US-09.2).
- [ ] A UUID never changes: not on an edit, a rename, a slug regenerate (US-09.5), an export, or an import.
- [ ] The app makes the installation UUID at its first start, and stores it in the database folder (Task 76). It never changes.
- [ ] A new entity gets `created_by_installation` and `last_modified_by_installation` with the local installation UUID.
- [ ] Each saved change sets `last_modified_by_installation` to the local installation UUID. For a league, any change to its wrapper counts, also a scorination.
- [ ] An entity imported as it is keeps both provenance fields from the file.
- [ ] The installation UUID never decides an identity, and never changes an entity UUID.
- [ ] League Detail routes by the league UUID, for example `/leagues/<uuid>` (impact review §2.1).
- [ ] References between entities use UUIDs, not slugs: an Instance to its Blueprint, and fixtures and results to their teams.
- [ ] The app does not show the provenance fields. The UUID shows only in the import picker (US-10.3) and the conflict dialog (US-11.2).
- [ ] A test exports a league and its Blueprints, imports them into an empty database, and checks that each UUID is the same.
- [ ] A deleted Blueprint has an unknown UUID. So an import of it creates it again with the same UUID, and the league Instances that keep this UUID find it again (US-09.4).

**Out of scope:** Seasons and Locations (MVP3). A provenance display. The CSV, which matches by slug (Task 75).

**Notes:** the user chose "provenance not shown" on 2026-10-28 (Task 96 gap 3). "No UUID for an Instance", "a scorination counts as a change", and the return of a deleted Blueprint by import are Claude choices. The user confirmed them on 2026-10-28.

---

### US-11.2: resolve an import conflict

**Status:** Agreed
**Spec:** `docs/scorinator-mvp2.md` §1 Identity & Provenance System, §2 Identity & Provenance

As a user, when an import conflicts with something I already have, I want to be asked whether to skip it or bring it in as a new separate copy, so that my existing data is never silently overwritten.

**Acceptance criteria:**

- [ ] An import never overwrites a local entity.
- [ ] An incoming entity with an unknown UUID imports as it is.
- [ ] An incoming entity with a known UUID and the same content imports nothing, with no prompt. The import message counts it, for example "2 already up to date."
- [ ] Each other incoming entity with a known UUID is a conflict. After the picker (US-10.3), the "Resolve conflicts" dialog shows, as in the handoff: "These already exist locally by UUID. Skip keeps your local version untouched; Import as new forks the incoming one with a fresh UUID."
- [ ] The dialog has one row for each conflict: the type (team or league), the name, the UUID, and the choice "Skip" or "Import as new". Each row starts on Skip.
- [ ] "Skip all" and "Import all as new" above the rows set every row at once. A row can still change after that.
- [ ] "Confirm" applies the choices and the rest of the import. "Cancel" stops the whole import, and nothing changes.
- [ ] Skip keeps the local entity and drops the incoming one.
- [ ] Import as new gives the incoming entity a fresh UUID, with the local installation in both provenance fields. The local entity does not change.
- [ ] A Blueprint imported as new gets a unique slug by the `-2` rule (Task 75). Its name stays.
- [ ] A league imported as new keeps its name. Its Instances keep the UUIDs of their Blueprints.
- [ ] A league import keeps a known embedded Blueprint, with no prompt, and adds an unknown one (US-10.3). Only the league itself can be a conflict.
- [ ] The database import uses the same rules and the same dialog (US-10.4).
- [ ] The CSV import never shows this dialog. It matches by slug, with its own confirm (Task 75).
- [ ] Tests cover each path: unknown UUID, known UUID with the same content, Skip, Import as new, the "all" buttons, and Cancel.

**Out of scope:** a merge of two versions field by field. An overwrite choice.

**Notes:** the user chose "skip silently for the same content" (gap 1) and the "all" buttons (gap 2) on 2026-10-28. "Each row starts on Skip", "Cancel stops the whole import", and the names after Import as new are Claude choices. The user confirmed them on 2026-10-28. The spec has lines for gap 1 and for the embedded Blueprint rule of US-10.3 since 2026-10-28, with the user's OK.
