# Task 198: refine epic 15, Teams module

**Status:** Done

## Goal

Turn the Teams module items of the MVP3 spec into refined stories in `docs/user-stories/mvp3/15-teams-module.md`. The stories cover C36 and C44 (Must), and C7 (Should). C11 and C12 (Could) get stories only when the user asks. Claude asks the user questions, and writes the stories from the answers. Claude does not propose how a feature works (Task 195).

## Acceptance criteria

- [x] Each Must and Should item of epic 15 has one or more stories, with acceptance criteria, in the story template of `docs/user-stories/README.md`.
- [x] Each story comes from the user's answers. A gap that the user leaves open goes to the open questions of `PROGRESS.md`.
- [x] The user agrees each story (status Agreed).
- [x] A spec line changes only with the user's approval.

## Notes

- **2026-11-12:** Inputs. `docs/scorinator-mvp3.md` §1 Teams module. Future features §21 (collections): create, add and remove teams, rename, disband with the teams kept. To settle: one team in several collections, where collections show, and the files. `HUMAN.md` names the collections. Task 195: C36, C44, C7, C11, C12.
- **2026-11-12:** Facts from the code. The Teams screen is one flat list, with no search, sort, or filter. The wizard "Add teams" dialog (`PickerDialog`) already has a search field. A team colour is a hex string on the Blueprint and on the Instance, so a custom colour needs no new field. `design-system/` has `SwatchPicker`, but no `Slider`.

- **2026-11-12:** The user's answers, round 1.
  - (1) The user decides what a collection is for.
  - (2) One team can be in more than one collection.
  - (3) Collections show on the Teams screen and in the "Add teams" dialog. They group teams, so the user finds them faster, to edit them or to add them to a league or a Season.
  - (4) Create, rename, disband (the teams stay), add and remove teams. Nothing more. Descriptions come later, for almost every entity: parked as future features §34.
  - (5) Collections are exportable: the Blueprint JSON and the database zip. A collection column in the team CSV: the user is not sure.
  - (6) The search can match all the fields: the name, the slug, the Location, the trigrams.
  - (7) Only the search for now. A filter is parked: future features §35.
  - (8) The colour picker shows in the Blueprint drawer and in the Edit drawer of a league team.
  - (9) No check on a custom colour.
  - (10) No stories for C11 and C12 now.
- **2026-11-12:** Claude checked round 1. The MVP2 spec (§1 Identity) gives every exportable entity a UUID, so an exported collection gets a UUID and the import conflict rule. The wizard search matches the name and the Location only. Gaps sent as round 2.

- **2026-11-12:** The user's answers, round 2.
  - (1) A team joins a collection from a field in the Blueprint drawer, and from the collection detail.
  - (2) The Teams screen has two tabs: the collections and the teams list. Pages for the teams list: "another story".
  - (3) The "Add teams" dialog shows the teams of one collection, and adds all of them at once. The Season "Teams" tab does not group its roster by collection, for now.
  - (4) A collection name is unique.
  - (5) The search does not match the collection names, for now. The user asked which wizard Claude meant.
  - (6) The collection column in the CSV: parked as future features §36.
  - (7) A collection gets a UUID and the MVP2 import conflict rule.
- **2026-11-12:** Stories written: US-15.1 to US-15.7, status Refined. Three questions sent: the pages, the "Add teams" search fields, and the collections in the Season roster dialog.

- **2026-11-12:** The user's answers, round 3.
  - (1) Pages for the teams list: a story now (US-15.8).
  - (2) Every team search matches the name and the Location only, as today. Improvements: parked as future features §38. This replaces the round 1 answer "all the fields".
  - (3) The Season roster dialog has the collections too.
  - US-15.2: the "Collections" field opens a modal in the style of "Add teams", with a search, and the selected collections look different. A new collection from there: parked as §39.
  - US-15.3: pages for the collections list come later: parked as §37.
  - US-15.7: the colour picker is a modal. Row 1: the current and the selected colour. Row 2: the palette. Row 3: the custom colour. "Cancel" and "OK". This settles the spec open item on the picker layout. The spec edit waits for approval.
- **2026-11-12:** Stories updated: US-15.2 to US-15.7. US-15.8 added. Questions sent: the spec edit, and the pages.

- **2026-11-12:** The user's answers, round 4. (1) The user approved the spec edit for the colour modal: `scorinator-mvp3.md` §1 changed, and the §2 open item removed. (2) 20 teams on a page. (3) "Previous", "Next", and page numbers. (4) The search looks through all teams, and its results show in pages. US-15.8 updated.

- **2026-11-12:** The user agreed US-15.1 to US-15.8, with the Claude choices. The user approved the removal of the C6 open item from `scorinator-mvp3.md` §2, because US-13.10 settles it. Claude also updated the C6 line in §1 to match US-13.10.

## Report

**Delivered:** 8 Agreed stories in `docs/user-stories/mvp3/15-teams-module.md`, US-15.1 to US-15.8. They cover C36, C44 (Must), and C7 (Should), from four rounds of answers. US-15.8 (pages for the teams list) is new. C11 and C12 (Could) have no stories, by the user's choice.

**Spec changes, with the user's approval:**

- `scorinator-mvp3.md` §1 Teams module: the custom colour is a "Colour" modal with three rows.
- `scorinator-mvp3.md` §2: the open items on the picker design and on C6 are closed. §1 Season: the C6 line follows US-13.10.

**Parked in `scorinator-future-features.md`:** §34 descriptions for entities, §35 a filter and a sort on the Teams screen, §36 a collection column in the team CSV, §37 pages for the collections list, §38 more fields in the team searches, §39 a new collection from the Collections modal.

**Changes to MVP2 rules:**

- The palette moves from the drawer into the "Colour" modal (US-09.7).
- "Export all team blueprints" and the database zip carry the collections (US-10.2, US-10.4).
- The Teams screen gets two tabs, a search, and pages (US-09.1).

**Open questions:** none for epic 15.

**For the build tasks:**

- `PickerDialog` has the search of "Add teams" (name and Location). The "Collections" modal can follow its style.
- `design-system/` needs a `Slider` primitive, and maybe a pager.
- A collection is a new exportable entity: a UUID, provenance, and the import conflict rule. The JSON format version goes up.
