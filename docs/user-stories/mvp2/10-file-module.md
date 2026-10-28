# Epic 10: File Module

Refined in [Task 95](/docs/tasks/095-refine-file-module.md). Source: [`docs/scorinator-mvp2.md`](/docs/scorinator-mvp2.md) §1 File Module (generalized), §2 Epic: File Module. Layout reference: the MVP2 handoff, `Footballer - File Manager`.

**Terms used in this file:**

- **Database:** the app data folder with the manifest, one wrapper file for each league, and the Blueprints (Task 76).
- **League file:** a JSON file with one or many leagues. Each league embeds its Instances and a snapshot of their Blueprints.
- **Conflict:** an incoming entity whose UUID already exists locally. Epic 11 owns the Skip or Import as new rule.

---

### US-10.1: export one league from League Detail

**Status:** Agreed
**Spec:** `docs/scorinator-mvp2.md` §1 File Module, §2 File Module

As a user, I want an export button on each League's Detail screen that produces a self-contained file (teams included), so that I can share or back up that one league without extra steps.

**Acceptance criteria:**

- [ ] The League Detail header has an export menu with three items: "Export league (.json)", "Export results (.txt)" (US-10.6), and "Export slug list (.txt)" (US-10.5).
- [ ] "Export league" opens a save dialog, with the default name from the league slug, for example `coastal-premier.json`.
- [ ] The file holds the league with its UUID, details, phases, draws, fixtures, and results, and each Instance with its name, colour, slug, Tier, OVR, and Blueprint UUID.
- [ ] The file also holds a snapshot of each Blueprint that still exists, with its UUID, provenance, and Location. A deleted Blueprint has no snapshot (US-09.4).
- [ ] The file has a format version field.
- [ ] A test exports a league and imports the file into an empty database. The result is equal to the original.

**Out of scope:** the import (US-10.3). The conflict prompt (epic 11).

**Notes:** the handoff League Detail has no export button (Task 83), so the export menu is a Claude choice. The user confirmed it on 2026-10-28, and kept the slug list inside the menu. The format version comes from impact review §2.2.

---

### US-10.2: export all leagues or all Blueprints

**Status:** Agreed
**Spec:** `docs/scorinator-mvp2.md` §1 File Module, §2 File Module

As a user, I want to export all my leagues or all my team blueprints in bulk, so that I can back up everything at once.

**Acceptance criteria:**

- [ ] The File screen has three sections, as in the handoff: Leagues, Team Blueprints, and Database (US-10.4).
- [ ] The page text says: "Bulk export/import for leagues, team blueprints, and the whole database. Exporting a single league is on that league's Detail screen."
- [ ] "Export all leagues" writes one league file with every league, in the US-10.1 shape.
- [ ] "Export all team blueprints" writes one JSON file with every Blueprint: UUID, provenance, name, colour, slug, base Tier, and Location.
- [ ] Both files have a format version field.
- [ ] The Team Blueprints section keeps the quick CSV: "Export .csv" and "Import .csv…". Its text reads "ID/slug, Name, Colours, Tier, Location (optional). No provenance — for fast bulk edits, not identity-tracked sharing." (US-09.3, Task 75).
- [ ] The CSV import keeps the Task 75 rules: a slug match updates, a new slug creates, and one confirm gives the counts, for example "4 new, 8 updated. Continue?".
- [ ] With no leagues, "Export all leagues" is disabled. With no Blueprints, "Export all team blueprints" and "Export .csv" are disabled.
- [ ] The File screen has no Save league, Save as, or Load league (Task 76).

**Out of scope:** the import picker (US-10.3). City in the CSV (MVP3).

**Notes:** the handoff CSV text lists `City`, which is MVP3 scope (Task 74). The story uses Location in its place (US-09.3). The disabled states are Claude choices. The user confirmed them on 2026-10-28.

---

### US-10.3: pick what to import

**Status:** Agreed
**Spec:** `docs/scorinator-mvp2.md` §1 File Module, Identity & Provenance, §2 File Module

As a user, when I import a file with multiple leagues or teams, I want to pick which specific ones to bring in, so that I'm not forced to import everything in the file.

**Acceptance criteria:**

- [ ] The File screen has "Import leagues" and "Import teams". Each opens a file dialog for `.json`.
- [ ] The Leagues dashboard has an "Import league" button. It works as "Import leagues".
- [ ] A file with many items opens the picker, as in the handoff: "Found 5 in the file. Choose which to import.", one row for each item with a checkbox, its name, and its UUID. A row whose UUID exists locally has a "Conflict" tag.
- [ ] All rows start checked. "Import selected" is disabled with no row checked. "Cancel" imports nothing.
- [ ] A file with one item skips the picker.
- [ ] When the selection has conflicts, the epic 11 "Resolve conflicts" dialog follows.
- [ ] A league import adds the league with its Instances. For each embedded Blueprint snapshot: an unknown UUID adds the Blueprint, and a known UUID keeps the local Blueprint, with no prompt. The league never needs the local Blueprint, because its Instances hold their own data (US-09.2).
- [ ] After the import, a message gives the counts, for example "3 leagues imported. 1 skipped."
- [ ] A file that is not valid shows an error, and imports nothing.
- [ ] An MVP1 JSON file (a league save file or a teams JSON) shows: "This file is from Scorinator MVP1. MVP2 cannot import it. Move your teams with the CSV." It imports nothing.
- [ ] A teams JSON file in the "Import leagues" dialog, or a league file in "Import teams", shows an error with the right button to use.

**Out of scope:** the Skip or Import as new rule (epic 11). A conversion of MVP1 files: parked in `scorinator-future-features.md` §12.

**Notes:** the user chose the File screen plus the dashboard button on 2026-10-28 (Task 95 gap 1), and "no MVP1 import, park the conversion" (gap 3). The all-checked start, the silent keep of known embedded Blueprints, and the message texts are Claude choices. The user confirmed them on 2026-10-28.

---

### US-10.4: export and import the whole database

**Status:** Agreed
**Spec:** `docs/scorinator-mvp2.md` §1 File Module, §2 File Module

As a user, I want to export or import my entire database (teams, leagues, locations, story state) as one file, so that I can fully back up or transfer my whole setup.

**Acceptance criteria:**

- [ ] "Export entire database" writes one `.zip` file with the manifest, every league wrapper, and the Blueprints (Task 76). The default name has the date, for example `scorinator-database-2026-10-28.zip`.
- [ ] The section text says: "Everything — team blueprints and leagues, with their teams." It does not list seasons, locations, or story state, which arrive in MVP3 and MVP4.
- [ ] Unsaved changes go into the export too: the export reads the live state, not the files on disk.
- [ ] "Import entire database" opens a file dialog for `.zip`. It merges into the local database and never replaces it (spec).
- [ ] The import adds each entity with an unknown UUID. Each conflict goes to the epic 11 "Resolve conflicts" dialog. There is no picker.
- [ ] After the import, a message gives the counts of Blueprints and leagues added and skipped.
- [ ] A test exports a database and imports it into an empty one. The result is equal to the original.

**Out of scope:** seasons, locations, and story state (MVP3, MVP4). A wholesale replace of the database.

**Notes:** the handoff labels the database export `.json`. Task 76 chose `.zip`, and the story follows Task 76. The section text, the live-state export, and the file name are Claude choices. The user confirmed them on 2026-10-28.

---

### US-10.5: export the league slug list

**Status:** Agreed
**Spec:** `docs/scorinator-mvp2.md` §1 File Module (Export slug list), §2 File Module. A new story, from Task 93. The spec has it since 2026-10-28 (Task 95), with the user's OK.

As a user, I want to export a league's team slugs in ranking order, so that I can reuse the list in a new league with "Import slug list" (US-08.7).

**Acceptance criteria:**

- [ ] "Export slug list (.txt)" in the League Detail export menu writes a plain text file, one Instance slug on each line (US-09.2).
- [ ] The first line is a comment, for example `# Coastal Premier — final ranking, 2026-10-28`. The slug list import ignores it (US-08.7).
- [ ] The order is the final ranking. It works at any time, with the current results:
  - A team that reached a later phase comes before a team that went out in an earlier phase.
  - Inside a round-robin phase: the table order (Task 78).
  - Inside a Groups phase: the place across groups, then the Task 78 cross-group order (all group winners, then all runners-up, and so on).
  - Inside a Bracket phase: the round reached, later first. The final winner comes before the loser. With a third-place tie, its winner comes before its loser. Inside one round: the seed.
  - A team that went out in an earlier phase follows, in the order of that phase.
- [ ] The ranking is one pure function, with tests for a one-phase league, Groups → Bracket, and two round-robin phases.
- [ ] The file includes the slug of a team whose Blueprint was deleted (US-09.4).

**Out of scope:** a ranking table on screen.

**Notes:** new story. The user asked for it on 2026-10-28 (Task 93), and chose the final ranking on 2026-10-28 (Task 95 gap 2). The comment line and the tie order inside a bracket round are Claude choices. The user confirmed them on 2026-10-28.

---

### US-10.6: export the results as text

**Status:** Agreed
**Spec:** `docs/scorinator-mvp2.md` §1 File Module (Export results)

As a user, I want to export a league's results as a plain text file from its Detail screen, so that I can read or share them outside the app.

**Acceptance criteria:**

- [ ] "Export results (.txt)" in the League Detail export menu writes a plain text file, read only, as in MVP1 (Task 10).
- [ ] The file starts with the league name and its format line, for example "Group Stage → Bracket · 16 teams · Home adv. on · 3/1/0 pts" (US-01.2).
- [ ] Each started phase has a heading with its number and short name, for example "Phase 1 · Group Stage".
- [ ] A round-robin or Groups phase lists its table, or one table for each group, then the results by matchday.
- [ ] A Bracket phase lists each round with each tie: the legs, the aggregate, an asterisk for AET, "Pens 5-4", the replay, "Coin toss", or "Away goals". Then the winner line (US-04.14).
- [ ] The file uses the Instance names (US-08.4). It has no Location.
- [ ] The File screen no longer has the results export with a league selector (MVP1 Task 18).

**Out of scope:** a styled or PDF report.

**Notes:** new story ID for an existing spec rule, so the build task has one place to look. The line layout is a build-task choice, inside these criteria.
