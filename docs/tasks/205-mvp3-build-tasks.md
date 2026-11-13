# Task 205: split the MVP3 Must stories into build tasks

**Status:** Done

## Goal

Turn the 26 approved MVP3 Must stories into build task rows on the `PROGRESS.md` status board, in build order. Each build task names the story IDs it delivers. After this task, the MVP3 code starts.

## Acceptance criteria

- [x] Each of the 26 Must stories maps to one build task at least. The stories are in the `PROGRESS.md` scope line (Task 204).
- [x] No build task delivers a Should or Could story, or a part of one.
- [x] Each build task has a row on the board, numbered from 206, with its module and a short note: the story IDs and its main dependency.
- [x] This file holds the full map: each build task, its stories, its layer, and the tasks it depends on.
- [x] The order follows the rules: `design-system/` components before the screens that use them (`docs/design-reference/README.md`), `engine/` before `features/`, and the module boundaries (`docs/module-boundaries.md`).
- [x] Each build task is about one session of work. It stays inside one layer where it can, so it follows the test style of its layer (`docs/tdd.md`).
- [x] A shared item that the stories need gets its own task, for example a new primitive or a shared modal.
- [x] The build tasks form milestones. Each milestone ends with a smoke check task: the user tries the app before the next milestone starts.
- [x] A module question, for example a new folder, goes to the user. A change to `docs/module-boundaries.md` needs the user's approval.
- [x] A screen with no lo-fi prototype gets a simple demo HTML file before its build task. The user reviews the demo, and can ask for changes. The map shows each demo, and the build task that waits for it.
- [x] The user agrees the map before Claude adds the rows.

## Notes

- **2026-11-13:** Task created by User. Inputs: the 26 Must stories in `docs/user-stories/mvp3/` (epics 13 to 16), the spec `docs/scorinator-mvp3.md`, and the MVP2 model: [Task 84](/docs/archive/mvp2/tasks/084-mvp2-build-tasks.md), 56 build tasks in six milestones, a smoke check at the end of each.
- **2026-11-13:** MVP2 had a Claude Design handoff before its build (`docs/design-reference/MVP2/`, Task 83). MVP3 has no folder in `docs/design-reference/`. Question for the user.
- **2026-11-13:** The user agreed the criteria. No Claude Design handoff for MVP3: the build uses the stories and the sketches of the user. The user added a criterion: a simple demo HTML file before each screen with no lo-fi prototype, for a review, to avoid rework. Two questions on the demo sent.
- **2026-11-13:** The user agreed four demo choices. (1) One demo task at the start of each milestone, for all its new screens. The screen build tasks wait for its review. (2) The demos go in `docs/design-reference/MVP3/`, one static HTML file for each screen, with the CSS variables of `design-system/tokens`. (3) The team modal gets a demo too, because its sketch is a rough idea. The wizard condition row has a sketch, and gets no demo. (4) A demo shows the layout and the content, with fake data. It can switch tabs or open a modal. It has no real logic and no tests.
- **2026-11-13:** Claude drafted the map: 43 tasks (206 to 248) in five milestones, M1 to M5. A script checked the map: each of the 26 Must stories maps to one build task at least, and no row names US-13.10 or US-15.7. Three module questions (Q1 to Q3) sent.
- **2026-11-13:** The user agreed the map and the recommendations for Q1 to Q3. Claude added rows 206 to 248 to the status board, and a note on the MVP3 build milestones. Each row links to this file until its task file exists.
- **2026-11-13:** The user agreed the review: Done.

## Build map (Agreed)

Each milestone starts with a demo task and ends with a smoke check task. The screen tasks of a milestone wait for the review of its demo. "Depends on" names the tasks that must be Done first. Q1 to Q3 are the module questions below.

### M1: Season core

| # | Task | Layer | Stories | Depends on |
|---|---|---|---|---|
| 206 | Demo: the Seasons list, the create and rename dialog, the Season view with its tabs and league cards, the Teams tab, and its add dialog | `docs/design-reference/MVP3/` | US-13.1 to 13.4, US-13.9, US-16.5 | — |
| 207 | Season types: the Season, the Season wrapper, the playoff record, the finished flag, the Season manifest row | `domain/` | US-13.1, US-13.7, US-13.9 | — |
| 208 | Roster rules: the name clash suffix (the Location, then the first free number), the precedence, the trigram pick for the first batch and for a later join. One shared numbered name helper: "Liga (2)" | `engine/identity` | US-13.4, and the "(2)" rule of US-13.11, US-15.5, US-16.1 | — |
| 209 | Files: the Season wrapper file and its manifest row, parse and write. The database zip carries the Season wrappers | `adapters/json-io` | US-13.1, US-13.11 (database part) | 207 |
| 210 | Season store: open and save a Season wrapper. Create, rename, delete. Finish and reopen. The unique name and year. The read-only guard | `app/state` | US-13.1, US-13.2, US-13.9 | 209 |
| 211 | Roster actions: add Blueprints (OVR roll, names, trigrams). Edit the OVR, the Tier, and the trigram of a Season team | `app/state` | US-13.4 | 208, 210 |
| 212 | The Seasons menu and list: create, rename, delete, and search | `features/` (Q2), `app/` routes | US-13.1, US-13.2, US-16.5 | 206, 210 |
| 213 | The Season view and its Teams tab: the tabs, the roster, add and edit a team, finish and reopen | `features/` (Q2) | US-13.3 (the view), US-13.4, US-13.9 | 211, 212 |
| 214 | Smoke check M1 | — | — | 213 |

### M2: Season leagues and playoffs

| # | Task | Layer | Stories | Depends on |
|---|---|---|---|---|
| 215 | Demo: the Season league cards, the wizard Teams step in a Season, the Playoffs tab, the playoff dialog, and the Resume tab | `docs/design-reference/MVP3/` | US-13.3, US-13.5, US-13.7, US-13.8 | 214 |
| 216 | Season leagues in the store: create a league in a Season, the shared Season teams, parallel play, the read-only guard. The routes and the breadcrumbs | `app/state`, `app/` routes | US-13.5, US-13.6, US-13.9 | 214 |
| 217 | Playoffs in the store: create, the unique name, play with `playTie`, the result | `app/state` | US-13.7 | 214 |
| 218 | The wizard in a Season: Season teams first, the other Blueprints dimmed with a status, the join at create, the Edit drawer on the Season team | `features/leagues` | US-13.5 | 215, 216 |
| 219 | The league cards of the Season view. League Detail in a Season: the breadcrumbs, read only in a finished Season | `features/` | US-13.3, US-13.6, US-13.9 | 215, 216 |
| 220 | The Playoffs tab and the playoff dialog | `features/` (Q2) | US-13.7 | 215, 217 |
| 221 | The Resume tab: the winner or the first place, the zone teams, the highlight | `features/` (Q2) | US-13.8 | 219 |
| 222 | Smoke check M2 | — | — | 218, 220, 221 |

### M3: Team condition

| # | Task | Layer | Stories | Depends on |
|---|---|---|---|---|
| 223 | Demo: the League Detail Teams tab, and the team modal | `docs/design-reference/MVP3/` | US-14.2 | 222 |
| 224 | The real OVR: one pure function, with integer arithmetic | `engine/` (Q1) | US-14.1 | — |
| 225 | Condition data: a level for each team in each league and in each playoff. Parse and write | `domain/`, `adapters/json-io` | US-14.1, US-14.2, US-14.3 | 224 |
| 226 | Condition actions: set a level, the lock after the league ends, scorination with the real OVR | `app/state` | US-14.1, US-14.2, US-14.3 | 225 |
| 227 | `SegmentedControl`: the end labels ("Crisis", "Peak") and the level icons | `design-system/` | US-14.1 | — |
| 228 | The slug list with the level: parse and write, export and import | `adapters/txt`, `app/data` | US-14.4 | 226 |
| 229 | The condition in the wizards: the icon and the overlay in the Teams step, and in the playoff dialog | `features/` | US-14.2, US-14.3 | 226, 227 |
| 230 | The team modal: the read-only base, the control, "Cancel" and "Save", "Operation cancelled". It opens from six places of League Detail, and from the Season Teams tab with no control | `features/components/` (Q3) | US-14.2 | 223, 226, 227 |
| 231 | The League Detail Teams tab | `features/leagues` | US-14.2 | 223, 226, 227 |
| 232 | Smoke check M3 | — | — | 228 to 231 |

### M4: Teams module

| # | Task | Layer | Stories | Depends on |
|---|---|---|---|---|
| 233 | Demo: the Teams screen tabs, the Collections tab, the collection detail, the Collections modal, and the "Add teams" dialog with collections | `docs/design-reference/MVP3/` | US-15.1 to 15.4, US-15.6, US-15.8 | 232 |
| 234 | Collections in the domain and the files: the type with UUID and provenance, the manifest, the teams export, the database zip, the import plan | `domain/`, `adapters/json-io`, `engine/identity` | US-15.1, US-15.5 | 208 |
| 235 | Collection actions: create, rename, disband, add and remove teams, the Blueprint delete, the import | `app/state` | US-15.1, US-15.2, US-15.5 | 234 |
| 236 | A pages primitive: "Previous", "Next", and the page numbers | `design-system/` | US-15.8 | — |
| 237 | One team search for the three places, and the page slice | `features/components/` | US-15.6, US-15.8 | — |
| 238 | The Teams tab: the search and the pages | `features/teams` | US-15.3, US-15.6, US-15.8 | 233, 236, 237 |
| 239 | The Collections tab, the collection detail, and the Collections modal of the drawer | `features/teams`, `features/components/` | US-15.1, US-15.2, US-15.3 | 233, 235, 238 |
| 240 | Collections in the "Add teams" dialog and in the Season roster dialog | `features/` | US-15.4, US-15.6 | 233, 235, 237 |
| 241 | Smoke check M4 | — | — | 239, 240 |

### M5: League lists and the Season file

| # | Task | Layer | Stories | Depends on |
|---|---|---|---|---|
| 242 | Demo: the league card menu, the rename dialog, the dashboard search, and the Season export and import on the File screen | `docs/design-reference/MVP3/` | US-13.11, US-16.2 to 16.4 | 241 |
| 243 | The unique league name in its container: the check, the Details step block, "(2)" on a league import | `app/state`, `features/leagues` | US-16.1 | 208, 216 |
| 244 | Rename and delete a league in the store, in both containers. The file goes at the next save | `app/state` | US-16.2, US-16.3 | 216 |
| 245 | The Season file: one zip with the Season and a Blueprints file. Parse and write | `adapters/json-io` | US-13.11 | 209 |
| 246 | Rename and delete on the league card and in League Detail. The dashboard search | `features/leagues` | US-16.2, US-16.3, US-16.4 | 242, 244 |
| 247 | The Season export and import on the File screen: "Skip" or "Import as new", the numbered name. The export menu of a Season league. "Export all leagues" for standalone leagues only | `app/data`, `app/state`, `features/file` | US-13.11 | 242, 245 |
| 248 | Smoke check M5, and the end of the MVP3 Must items | — | — | 243, 246, 247 |

### Module questions (settled 2026-11-13)

- **Q1:** the real OVR function goes in `engine/tier-ovr`, next to the OVR roll. No new folder.
- **Q2:** the Season screens go in a new screen folder, `features/seasons/`. `FEATURES.md` allows a new screen folder, so `docs/module-boundaries.md` does not change.
- **Q3:** the team modal goes in `features/components/`, because League Detail and the Season view both open it.

## Report

**Delivered:** 43 build task rows on the status board, Tasks 206 to 248, in five milestones. The map above gives each task its stories, layer, and dependencies.

- M1, Season core: 206 to 214.
- M2, Season leagues and playoffs: 215 to 222.
- M3, Team condition: 223 to 232.
- M4, Teams module: 233 to 241.
- M5, League lists and the Season file: 242 to 248.

**Checks:** a script read the map. Each of the 26 Must stories maps to one build task at least. No row names a Should story (US-13.10, US-15.7).

**Decisions:** no Claude Design handoff for MVP3. A demo HTML file starts each milestone, in `docs/design-reference/MVP3/`. Q1 to Q3 settled. All are in the `PROGRESS.md` Decisions log.

**What is next:** Task 206, the M1 demo. Tasks 207 and 208 have no dependency, and can start before the demo review.

**Refactor:** No code, no refactor step.
