# Task 095: refine epic 10, File Module

**Status:** Done (2026-10-28)

## Goal

Turn the four spec stories of epic 10 into refined stories, with acceptance criteria, in `docs/user-stories/mvp2/10-file-module.md`. Add the league slug list export from Task 93. Find the gaps in the spec and get an answer for each. The build tasks (Task 84) start from these stories.

## Acceptance criteria

- [x] `docs/user-stories/mvp2/10-file-module.md` has US-10.1 to US-10.4, one for each spec story, in the README template.
- [x] A new story gets the next free ID, only when a gap needs one. Candidates: the league slug list export (Task 93), and the results `.txt` export on League Detail.
- [x] Each story has checkable criteria, an Out of scope line, and Notes that link to the spec and the decisions.
- [x] Each gap found has a user answer, or an entry in the `PROGRESS.md` Open questions.
- [x] The stories use the settled decisions: the CSV slug match with one confirm (Task 75), the database rules and the `.zip` export (Task 76), the Location column (US-09.3), the Instance fields (US-08.4, US-09.2), and the Blueprint delete (US-09.4).
- [x] The stories follow the MVP2 handoff where it shows the screen, unless the user overrides it.
- [x] A spec edit happens only with the user's OK.
- [x] The user agrees each story, and its status becomes Agreed.

## Notes

- **2026-10-28:** Spec stories of epic 10 (`docs/scorinator-mvp2.md` §2): a per-league export on League Detail, a bulk export of all leagues and all Blueprints, a picker for an import with many leagues or teams, and an export and import of the whole database. Spec rules: §1 File Module (generalized). The results `.txt` export moves to League Detail.
- **2026-10-28:** Settled inputs. CSV rows match by slug, with one confirm: "4 new, 8 updated. Continue?" (Task 75). JSON and league imports keep the Skip or Import as new prompt (Task 75, epic 11). The database lives in the app data folder. Save and Ctrl+S write the database. No Save league, Save as, or remembered path. The database export is one `.zip` (Task 76). The CSV has an optional Location column (US-09.3). An Instance holds its own name, colour, slug, Tier, and OVR (US-08.4, US-09.2). The league slug list export comes from Task 93.
- **2026-10-28:** The handoff (`File Manager`) shows three sections: Leagues (Export all leagues, Import leagues), Team Blueprints (Export all team blueprints, Import teams, and the CSV), and Database (Export entire database, Import entire database). The page text: "Exporting or importing a single league is on that league's Detail screen." The import picker shows each item with its name, its UUID, and a "Conflict" tag, then "Import selected". A "Resolve conflicts" dialog gives Skip or Import as new for each item. Differences: the CSV line lists `City` (MVP3, Task 74). The database export is `.json`, but Task 76 chose `.zip`. The database text lists seasons, locations, and story state (MVP3 and MVP4). The League Detail screens of the handoff have no export button (Task 83).
- **2026-10-28:** Gaps found. Each needs a user answer.
  1. Where the user imports one league. The spec and the handoff say League Detail, but a Detail screen shows a league that already exists.
  2. The order of the league slug list export, for a league with several phases.
  3. Whether MVP2 imports the MVP1 files: league save files and team JSON.
- **2026-10-28:** The user agreed the criteria. Gap answers: (1) one league imports from the File screen ("Import leagues") and from a new "Import league" button on the Leagues dashboard. (2) The slug list export uses the final ranking. (3) MVP2 does not import MVP1 files. The conversion is parked in `scorinator-future-features.md` §12.
- **2026-10-28:** Claude wrote US-10.1 to US-10.6, with the status Refined. US-10.5 (slug list export) and US-10.6 (results `.txt`) are new IDs.

- **2026-10-28:** The user asked where the slug list export lives. Claude offered a separate button and a File screen entry. The user kept it as one item in the League Detail export menu.
- **2026-10-28:** The user agreed US-10.1 to US-10.6, the Claude choices, and five spec edits. Status: Agreed. Claude edited `docs/scorinator-mvp2.md` §1 File Module (the single-league import, the `.zip`, the slug list export, MVP1 files) and §2 (a story line).

## Report

- **What was built:** `docs/user-stories/mvp2/10-file-module.md`, with six Agreed stories. US-10.1 to US-10.4 come from the spec. US-10.5 (slug list export) is new. US-10.6 gives the results `.txt` export its own ID.
- **Test approach:** none, no code changed. The stories name the tests: a league round trip (US-10.1), a database round trip (US-10.4), and the final ranking for three league shapes (US-10.5).
- **Decisions made:** the gap answers and the confirmed Claude choices in the Notes above, and in the `PROGRESS.md` Decisions log on 2026-10-28.
- **Spec edits:** five, in `docs/scorinator-mvp2.md` §1 and §2, with the user's OK. Each one is marked with its date and Task 95.
- **Parked:** `docs/scorinator-future-features.md` §12, import MVP1 files.
- **Effect on other tasks:**
  - **Task 96 (Identity):** the "Resolve conflicts" dialog of the handoff. A league import keeps a known embedded Blueprint with no prompt (US-10.3). Check this against the epic 11 rule.
  - **Design system:** a dropdown menu for the League Detail export menu, the picker dialog, and the confirm modal (impact review §2.13).
  - **Adapters:** a zip library for the database export, for example fflate (Task 76).
- **What is left, what is next:** nothing. Next is Task 96, Identity & Provenance.
