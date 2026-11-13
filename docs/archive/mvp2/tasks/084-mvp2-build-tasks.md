# Task 084: split the MVP2 epics into build tasks

**Status:** Done (2026-10-28)

## Goal

Turn the 59 Agreed MVP2 stories (epics 01 to 12) into build task rows on the `PROGRESS.md` status board, in build order. Each build task names the story IDs it delivers. This is the last sprint 0 task. After it, MVP2 code starts.

## Acceptance criteria

- [x] Each Agreed story maps to one build task at least. The Dropped stories (US-02.3, US-05.1) map to none.
- [x] Each build task has a row on the board, numbered from 103, with its module and a short note: the story IDs and its main dependency.
- [x] This file holds the full map: each build task, its stories, its layer, and the tasks it depends on.
- [x] The order follows the rules: `design-system/` components before the screens that use them (`docs/design-reference/README.md`), engine before features, and the module boundaries (`docs/module-boundaries.md`).
- [x] Each build task is about one session of work, and stays inside one layer where it can, so each one follows its `docs/tdd.md` test style.
- [x] Shared items found in the stories get their own task: for example the Tooltip, the confirm modal, the picker dialog, and the zone tokens.
- [x] The user agrees the order and the size before Claude adds the rows.

## Notes

- **2026-10-28:** Inputs. 61 stories in `docs/user-stories/mvp2/`: 59 Agreed, 2 Dropped. Spec: `docs/scorinator-mvp2.md`. Test styles by layer: `docs/tdd.md`. MVP1 sized a build task as one engine area or one screen (archived MVP1 board, Tasks 2 to 13). Shared components named in the stories: Tooltip (US-09.3, 09.5, 12.1 to 12.3), confirm modal (US-04.6, 07.3, 09.4, 09.5, 10.2), picker dialog (US-08.1, 08.5, 10.3), dropdown menu (US-10.1), icon-only button (US-09.5), and zone tokens (US-12.5). The zip library comes with the database export (Task 76).

- **2026-10-28:** The user agreed the criteria, the milestone order, and a review stop at the end of each milestone.
- **2026-10-28:** Claude drafted the map below. Two module questions (Q1, Q2) went to the user.
- **2026-10-28:** The user agreed the map, Q1 (a new folder `engine/phases`), and Q2 (the `.zip` in `adapters/json-io`). Claude added `engine/phases` to `docs/module-boundaries.md`, and added rows 103 to 158 to the status board.

## Build map (Agreed)

Each milestone ends with a working app and a smoke check task: run the app, run the end-to-end test of the milestone, and list what works. The user reviews it before the next milestone starts. "Depends on" names the tasks that must be Done first.

### M1: identity, data model, and database

| # | Task | Layer | Stories | Depends on |
|---|---|---|---|---|
| 103 | UUID v4 with an injected source. The unique slug function (`-2` rule) | `engine/identity` | US-11.1, US-09.5 (rule), Task 75 | — |
| 104 | Record types v2: Blueprint, Instance, League with phases, provenance. Persistence contracts for the manifest and the wrappers | `domain/`, `persistence/` | US-09.2, US-11.1 | 103 |
| 105 | Fixture ids, and the result lookup by id | `engine/round-robin` | Task 77, US-02.2 (ids) | 104 |
| 106 | JSON v2: manifest and wrapper files with a format version. The MVP1 file check | `adapters/json-io` | Task 76, US-10.3 (MVP1 message) | 104 |
| 107 | The database folder, the installation UUID, wrappers then manifest | `adapters/tauri-fs` | Task 76 (a, b), US-11.1 | 106 |
| 108 | Stores on the database: open at start, Save and Ctrl+S, unsaved snapshots, the summary row, routes by UUID | `app/` | Task 76 (b, c, d), US-11.1 | 105, 107 |
| 109 | The MVP1 screens on the v2 model: Teams, the wizard, League Detail, the dashboard | `features/` | US-09.1, US-09.2 | 108 |
| 110 | M1 smoke check | all | — | 109 |

### M2: Teams module and team selection

| # | Task | Layer | Stories | Depends on |
|---|---|---|---|---|
| 111 | Tooltip, and the icon-only Button variant | `design-system/` | US-09.3, US-09.5, US-12.1 to 12.3 | 110 |
| 112 | Modal, with a focus trap, and the confirm pattern | `design-system/` | US-04.6, 07.3, 09.4, 09.5, 10.2 | 110 |
| 113 | Picker dialog: search, multi-select and single-select | `design-system/` | US-08.1, 08.5, 10.3 | 112 |
| 114 | The 24-colour palette, and 3 rows in the swatch picker | `design-system/` | US-09.7 | 110 |
| 115 | Trigrams: the auto trigram, the format check, the league pick | `engine/identity` | US-09.6 | 110 |
| 116 | The OVR override range check, and the roll on a Tier change | `engine/tier-ovr` | US-08.4, Task 81 | 110 |
| 117 | CSV v2: the Location and Trigrams columns, the counts for the confirm | `adapters/csv` | US-09.3, 09.6, 10.2, Task 75 | 110 |
| 118 | The slug list parse | `adapters/txt` | US-08.7 | 110 |
| 119 | Teams screen: the columns, the drawer fields, slug regenerate, Delete, the CSV confirm | `features/teams` | US-09.1, 09.3 to 09.7, 10.2 (CSV) | 111, 112, 114, 115, 117 |
| 120 | Wizard Teams step, part 1: the add dialog, Load them all, empty states, Import slug list | `features/leagues` | US-08.1, 08.2, 08.3, 08.7 | 113, 118, 119 |
| 121 | Wizard Teams step, part 2: Edit for this league, Switch, Remove, the live trigram pick, "Create league" | `features/leagues` | US-08.4 to 08.6, 08.8, 09.6 (league) | 116, 120 |
| 122 | M2 smoke check | all | — | 121 |

### M3: phases, groups, and phase transition

| # | Task | Layer | Stories | Depends on |
|---|---|---|---|---|
| 123 | `generateSingleDuels`, the shared pairing, the doc comment fix | `engine/round-robin` | US-06.1 | 122 |
| 124 | Standings v2: fixed lots, the recursive mini-league, the cross-group order, best M | `engine/standings` | US-01.4, 01.6, 02.2, Task 78 | 122 |
| 125 | The group draw: size or count, add to the smallest group, moves | `engine/round-robin` | US-02.1, 02.5 | 122 |
| 126 | Phase chain rules: bracket last, fit checks, qualifier counts, build and start a phase, the lock | `engine/phases` | US-01.3, 01.4, 01.6, 07.1, 07.3 | 123, 124, 125 |
| 127 | Dropdown menu | `design-system/` | US-02.5 (Move to group), US-10.1 | 122 |
| 128 | League state with phases: scorinate in a phase, start the next phase, the progress text | `app/` | US-01.2, 07.1, 07.3 | 126 |
| 129 | Wizard Phases step: phases, formats, advancement, best M, warnings | `features/leagues` | US-01.1 to 01.6 | 128 |
| 130 | Wizard Teams step with groups: group columns, Shuffle, drag, Move to group | `features/leagues` | US-02.1, 02.4, 02.5 | 127, 129 |
| 131 | League Detail with phases: tabs, header, badge, group cards, group fixtures, dashboard card text | `features/leagues`, `features/standings` | US-01.2, 02.2, 02.4 | 128 |
| 132 | Phase transition: "Start phase N", the confirm, the lock, the empty tab, the qualifier highlight | `features/leagues` | US-07.1 to 07.3 | 131 |
| 133 | M3 smoke check | all | — | 130, 132 |

### M4: bracket and tiebreaks

| # | Task | Layer | Stories | Depends on |
|---|---|---|---|---|
| 134 | AET: a time share of the match, with the bands | `engine/scorination` | US-03.1 | 133 |
| 135 | Penalties, the coin toss, the four sequences, away goals | `engine/tiebreak` | US-03.2, 03.3, 04.4 | 134 |
| 136 | Bracket tree: seeds, the standard placement, byes and the bye change, round names, tie ids | `engine/bracket` | US-04.2, 04.10, 04.11, 04.14 | 133 |
| 137 | Bracket play: playable ties, one round, the dependent clear, third place, single-match final | `engine/bracket` | US-04.1, 04.5, 04.7, 04.12, 04.13 | 135, 136 |
| 138 | Segmented control | `design-system/` | US-03.2, 04.1, 11.2 | 133 |
| 139 | Bracket state: phase start for a bracket, the first-phase draw, tie actions, the bye change | `app/` | US-04.2, 04.5, 04.6, 04.10 | 137 |
| 140 | Wizard bracket settings: tie format, away goals, AET, method, third place, single-match final, the power-of-2 warning | `features/leagues` | US-03.1, 03.2, 04.1, 04.3, 04.9, 04.12, 04.13 | 138, 139 |
| 141 | League Detail bracket: the tree, tie cards, Scorinate, the re-scorinate confirm, TBD, BYE, the winner line | `features/leagues` | US-04.5 to 04.8, 04.11, 04.14 | 139 |
| 142 | Seed List: seeds, tags, the bye stars, the bye change confirm | `features/leagues` | US-04.2, 04.10, 07.2 | 141 |
| 143 | M4 smoke check | all | — | 140, 142 |

### M5: file module and identity

| # | Task | Layer | Stories | Depends on |
|---|---|---|---|---|
| 144 | Import decisions: unknown, same content, conflict, Skip, Import as new, the embedded Blueprint rule | `persistence/` | US-11.2, 10.3 | 143 |
| 145 | League and Blueprint files: one or many, format versions, wrong-file errors | `adapters/json-io` | US-10.1 to 10.3 | 144 |
| 146 | The database `.zip` export and import | `adapters/json-io` | US-10.4 | 145 |
| 147 | The final ranking across phases | `engine/phases` | US-10.5 | 143 |
| 148 | Text v2: results with phases, groups, and ties, and the slug list writer | `adapters/txt` | US-10.5, 10.6 | 147 |
| 149 | File screen: the three sections, the picker, the conflict dialog, messages, dashboard "Import league" | `features/file` | US-10.2 to 10.4, 11.2 | 145, 146 |
| 150 | League Detail export menu: league `.json`, results `.txt`, slug list `.txt` | `features/leagues` | US-10.1, 10.5, 10.6 | 148 |
| 151 | M5 smoke check | all | — | 149, 150 |

### M6: standings display

| # | Task | Layer | Stories | Depends on |
|---|---|---|---|---|
| 152 | Zone tokens, Form dot tokens, and their contrast test | `design-system/` | US-12.1, 12.5 | 151 |
| 153 | The last N results, and the places by matchday | `engine/standings` | US-12.1, 12.4 | 151 |
| 154 | Standings table: Form with hints, GF and GA in the GD hint, header hints | `features/standings` | US-12.1 to 12.3 | 152, 153 |
| 155 | Zones: the wizard section, "Edit zones", tint, stripe, legend, in place of the highlight | `features/` | US-12.5, 02.2, 07.2 | 152 |
| 156 | The position chart: the "Chart" sub-tab, SVG, the group selector | `features/standings` | US-12.4 | 153 |
| 157 | Trigrams and Location on league screens: narrow tables, fixtures, the Location hint | `features/` | US-09.3, 09.6 | 154 |
| 158 | M6 smoke check: MVP2 complete | all | — | 155, 156, 157 |

### Module questions (settled 2026-10-28)

- **Q1:** the phase chain rules (Task 126) and the final ranking (Task 147) need a home in `engine/`. The module map has no fit. The user agreed a new folder, `engine/phases`.
- **Q2:** the database `.zip` (Task 146) needs a home in `adapters/`. The user agreed `adapters/json-io`, beside the files it bundles, with no new folder.

## Report

- **What was built:** the MVP2 build map above: 56 build tasks (103 to 158) in six milestones, each with its stories, layer, and dependencies. Rows 103 to 158 are on the `PROGRESS.md` board.
- **Test approach:** none, no code changed. A script checked that each of the 59 Agreed stories maps to a build task.
- **Decisions made:** the milestone order with a review stop, `engine/phases`, and the `.zip` in `adapters/json-io`. All in the `PROGRESS.md` Decisions log on 2026-10-28.
- **Doc edit:** `docs/module-boundaries.md` gets `engine/phases`, with the user's OK.
- **What is left, what is next:** sprint 0 is complete. Next is Task 103, the first M1 build task. Each build task creates its own task file when it starts.
