# Scorinator — Progress Log (MVP2)

Read this file first, every session. Read it before you touch code or specs. See `CLAUDE.md` for the rules this log enforces.

The MVP1 log is archived at [`docs/archive/mvp1/PROGRESS.md`](/docs/archive/mvp1/PROGRESS.md), with its reports and decision files. It is read only. Read it when a task needs MVP1 history: a decision, a report, or the reason for a choice.

---

## Current approved scope

**MVP1 and MVP2 only.** MVP1 is complete, and its log is archived. MVP2 is the current work. MVP3 and MVP4 specs exist for context. They are not approved for implementation. Do not build anything from them. This line is the single source of truth for scope. If it still says MVP1/2 only, treat that as current, even when a task description elsewhere seems to imply more.

---

## Status board

One row for each task. Keep this table current. A new session reads this table first, to see where things stand.

**Every activity is a task.** When the user asks for work that no row covers, add a row first, with "Task created by User - <date>" in the Notes. Then write its task file with the goal and the acceptance criteria. Agree them with the user before the work starts. A small request gets a small task, not an exception.

**Keep the Notes column short:** one line, about 20 words at most. Use it for where the task stands, what it waits for, or what it depends on. Write the detail in the task file (see Task files below), and link the file in the Task file column.

Do not mark a task as Done until the user gives feedback and agrees with what was delivered. The user can ask for adjustments. After the implementation, mark the task as "Review". Mark it "Done" when the user agrees, and set the Completed date.

| # | Task | Module | Status | Started | Completed | Task file | Notes |
|---|------|--------|--------|---------|-----------|-----------|-------|
| 74 | Spec and doc edits: apply the 8 edits listed in `docs/mvp1-to-mvp2-impact-review.md` §3 | `docs/` | ✅ Done | 2026-10-26 | 2026-10-26 | [074](/docs/tasks/074-spec-edits.md) | Sprint 0. Edits 1 to 6 and 8 applied. Edit 7 dropped. |
| 75 | Settle open decision 1: CSV import matching | `adapters/csv`, `app/data` | ✅ Done | 2026-10-27 | 2026-10-27 | [075](/docs/tasks/075-csv-import-matching.md) | Sprint 0. Decided: slug upsert with one confirm dialog, unique slugs. |
| 76 | Settle open decision 2: the database | `persistence/`, `adapters/` | ✅ Done | 2026-10-27 | 2026-10-27 | [076](/docs/tasks/076-database.md) | Sprint 0. All five points decided. |
| 77 | Settle open decision 3: stable fixture IDs | `engine/round-robin`, `domain/` | ✅ Done | 2026-10-27 | 2026-10-27 | [077](/docs/tasks/077-stable-fixture-ids.md) | Sprint 0. Decided: position ids, plus a third-place toggle. |
| 78 | Settle open decision 4: qualification | `engine/standings` | ✅ Done | 2026-10-27 | 2026-10-27 | [078](/docs/tasks/078-qualification.md) | Sprint 0. Decided: UUID-hash lots, recursive mini-league, seed by place then stats. |
| 79 | Settle open decision 5: who hosts the second leg of a two-legged tie | `engine/bracket` | ✅ Done | 2026-10-27 | 2026-10-27 | [079](/docs/tasks/079-second-leg-host.md) | Sprint 0. Decided: the higher seed hosts, single-match final toggle. |
| 80 | Settle open decision 6: the AET and penalty models | `engine/scorination`, `engine/tiebreak` | ✅ Done | 2026-10-27 | 2026-10-27 | [080](/docs/tasks/080-aet-penalties.md) | Sprint 0. Decided: AET 1/3 xG, kick-by-kick penalties w = 0.10, with test bands. |
| 81 | Settle open decision 7: when OVR is rolled | `engine/tier-ovr`, `app/state` | ✅ Done | 2026-10-27 | 2026-10-27 | [081](/docs/tasks/081-ovr-roll-timing.md) | Sprint 0. Decided: roll at add-to-league, override inside the Tier range, roll again on a Tier change. |
| 82 | Settle open decision 8: the single duels generator | `engine/round-robin` | ✅ Done | 2026-10-27 | 2026-10-27 | [082](/docs/tasks/082-single-duels-generator.md) | Sprint 0. Decided: new `generateSingleDuels(teams, rng)`, shared pairing, spec balance rule. |
| 83 | MVP2 design reference: add the Claude Design handoff bundle for MVP2 at `docs/design-reference/MVP2/`, or decide to build the MVP2 screens without one | `docs/design-reference` | ✅ Done | 2026-10-27 | 2026-10-27 | [083](/docs/tasks/083-mvp2-design-reference.md) | Sprint 0. Handoff added. Review against Tasks 86 and 87 done: D1 to D9 decided. |
| 84 | Split the MVP2 epics into build task rows, in build order | `PROGRESS.md` | ⬜ Not started |  |  |  | Sprint 0. Do it last, after the refinement Tasks 86 to 96, and Tasks 100 to 102. |
| 85 | MVP2 workflow directives: refined user stories in their own files, short status board notes with detail in a task file, and one task for every activity | `PROGRESS.md`, `docs/` | ✅ Done | 2026-10-26 | 2026-10-26 | [085](/docs/tasks/085-workflow-directives.md) | Task created by User - 2026-10-26. |
| 86 | Refine epic 01, League Format Configuration: refined stories in `docs/user-stories/mvp2/01-league-format.md` | `docs/user-stories` | ✅ Done | 2026-10-27 | 2026-10-27 | [086](/docs/tasks/086-refine-league-format.md) | Sprint 0. Six stories Agreed (US-01.1 to US-01.6). One spec line added. |
| 87 | Refine epic 02, Groups: refined stories in `docs/user-stories/mvp2/02-groups.md` | `docs/user-stories` | ✅ Done | 2026-10-27 | 2026-10-27 | [087](/docs/tasks/087-refine-groups.md) | Sprint 0. Four stories Agreed, US-02.3 Dropped (MVP3). Two spec lines added. |
| 88 | Refine epic 03, Tiebreak Configuration: refined stories in `docs/user-stories/mvp2/03-tiebreak-configuration.md` | `docs/user-stories` | ✅ Done | 2026-10-27 | 2026-10-27 | [088](/docs/tasks/088-refine-tiebreak.md) | Sprint 0. Three stories Agreed (US-03.1 to US-03.3). Spec table row 3 and two bullets edited. |
| 89 | Refine epic 04, Bracket Phase: refined stories in `docs/user-stories/mvp2/04-bracket-phase.md` | `docs/user-stories` | ✅ Done | 2026-10-28 | 2026-10-28 | [089](/docs/tasks/089-refine-bracket-phase.md) | Sprint 0. 14 stories Agreed (US-04.1 to US-04.14), three new. Four spec edits. |
| 90 | Refine epic 05, Region Adjacency: refined stories in `docs/user-stories/mvp2/05-region-adjacency.md` | `docs/user-stories` | ✅ Done | 2026-10-28 | 2026-10-28 | [090](/docs/tasks/090-refine-region-adjacency.md) | Sprint 0. US-05.1 Dropped: Regions are MVP3. One spec note added. |
| 91 | Refine epic 06, Single Duels Home/Away Balancing: refined stories in `docs/user-stories/mvp2/06-single-duels-balancing.md` | `docs/user-stories` | ✅ Done | 2026-10-28 | 2026-10-28 | [091](/docs/tasks/091-refine-single-duels-balancing.md) | Sprint 0. US-06.1 Agreed. Count display parked (future features §8). |
| 92 | Refine epic 07, Phase Transition: refined stories in `docs/user-stories/mvp2/07-phase-transition.md` | `docs/user-stories` | ✅ Done | 2026-10-28 | 2026-10-28 | [092](/docs/tasks/092-refine-phase-transition.md) | Sprint 0. Three stories Agreed, US-07.3 new. Phases lock at next start. One spec line. |
| 93 | Refine epic 08, Team Selection in League Setup: refined stories in `docs/user-stories/mvp2/08-team-selection.md` | `docs/user-stories` | ✅ Done | 2026-10-28 | 2026-10-28 | [093](/docs/tasks/093-refine-team-selection.md) | Sprint 0. Eight stories Agreed, US-08.7 and 08.8 new. Five spec edits. |
| 94 | Refine epic 09, Teams Module (Blueprints): refined stories in `docs/user-stories/mvp2/09-teams-module.md` | `docs/user-stories` | ✅ Done | 2026-10-28 | 2026-10-28 | [094](/docs/tasks/094-refine-teams-module.md) | Sprint 0. Five stories Agreed, US-09.4 and 09.5 new. Four spec edits. |
| 95 | Refine epic 10, File Module: refined stories in `docs/user-stories/mvp2/10-file-module.md` | `docs/user-stories` | ✅ Done | 2026-10-28 | 2026-10-28 | [095](/docs/tasks/095-refine-file-module.md) | Sprint 0. Six stories Agreed, US-10.5 and 10.6 new. Five spec edits. |
| 96 | Refine epic 11, Identity & Provenance: refined stories in `docs/user-stories/mvp2/11-identity-provenance.md` | `docs/user-stories` | ✅ Done | 2026-10-28 | 2026-10-28 | [096](/docs/tasks/096-refine-identity-provenance.md) | Sprint 0. Two stories Agreed. Two spec bullets. |
| 97 | Fix the `docs/tdd` link in `CLAUDE.md`, and check the other repo links | `CLAUDE.md`, `docs/` | ✅ Done | 2026-10-26 | 2026-10-26 | [097](/docs/tasks/097-tdd-link.md) | Task created by User - 2026-10-26. |
| 98 | Reword the decision rows: "Can close inside Task X" becomes "Related epics: … One of them can settle this decision." | `PROGRESS.md` | ✅ Done | 2026-10-26 | 2026-10-26 | [098](/docs/tasks/098-decision-row-wording.md) | Task created by User - 2026-10-26. |
| 99 | A Location label on each team: story US-09.3 in `docs/user-stories/mvp2/09-teams-module.md`, with every place it shows | `docs/user-stories` | ✅ Done | 2026-10-28 | 2026-10-28 | [099](/docs/tasks/099-team-location-label.md) | Task created by User - 2026-10-28. US-09.3 Agreed. Three spec edits. |
| 100 | Team trigrams: story US-09.6, a three-letter code with alternatives by Tier | `docs/user-stories` | ✅ Done | 2026-10-28 | 2026-10-28 | [100](/docs/tasks/100-team-trigrams.md) | Task created by User - 2026-10-28. US-09.6 Agreed. Three spec edits. |
| 101 | Team palette: more colours, two blues easier to tell apart | `docs/`, `design-system/` | ⬜ Not started |  |  | [101](/docs/tasks/101-team-palette.md) | Task created by User - 2026-10-28. Draft feature #6. |
| 102 | Refine new epic 12, Standings display: last 5, GF and GA hover, header hints, chart, zones | `docs/user-stories` | ⬜ Not started |  |  | [102](/docs/tasks/102-standings-display.md) | Task created by User - 2026-10-28. Draft features #2 to #5, #7. After Task 100. |

**Status legend:** ⬜ Not started · 🟨 In progress · 🟧 Blocked (needs input, see Open Questions) · 🟩 Review · ✅ Done · ❌ Cancelled (the reason is in the Notes column)

**Note on numbering:** MVP2 task numbers continue from the MVP1 log, which ends at Task 73. Code comments and docs name tasks by number, for example "(Task 30)", so each number must stay unique across both logs. A task number below 74 is an MVP1 task. Find it in the archive.

**Note on sprint 0:** Tasks 74 to 96 are sprint 0. They settle the specs, the open decisions, the refined stories, and the design reference before MVP2 code starts. A refinement task can settle a decision of its epic (Tasks 75 to 82). The decision task is then Done, and its notes link to the refinement task. Task 84 comes last, because the build tasks come from the refined stories. The user can edit, reorder, or cancel any of these tasks.

Do not reorder or renumber completed rows. Add a new task at the bottom of the table as soon as you identify it. The MVP2 task list in the table above is a starting point, not a full list. A session should add a row for anything it finds it needs, for example a primitive that turns out to be required earlier than planned.

---

## Task files

Each task has one file in `docs/tasks/`, named `NNN-short-slug.md`. It holds the goal, the acceptance criteria, the notes, and the report. See [`docs/tasks/README.md`](/docs/tasks/README.md) for the rules and the template. Create the file when the task starts, at the latest. Write the report before the task goes to Review.

If a task stops before it finishes, say so plainly in the report. State what is done, what is broken or missing, and what decision or input the work needs to continue. The report of a blocked task matters more than the report of a finished task. It stops the next session from redoing failed work blind.

---

## User stories

Refined stories live in `docs/user-stories/`, one file for each epic. See [`docs/user-stories/README.md`](/docs/user-stories/README.md) for the story IDs, the template, and the status values. A build task names the story IDs it delivers.

---

## Open questions

A running list of items flagged under the `CLAUDE.md` open items section. Each item needs a decision from the user before work can proceed. List the newest item at the top. Once an item is resolved, remove it from this list. Note the resolution inline in the report of the relevant task. Do not delete the history silently.

The 8 MVP2 decisions below come from `docs/mvp1-to-mvp2-impact-review.md` §4, which has the full reasoning. Each one needs a decision before the related MVP2 task starts. The numbers are the ones the review uses.

- **2026-10-28 (Task 99, for MVP3 — the team Location label):** MVP2 adds a free-text Location label to each Blueprint (US-09.3). MVP3 adds a City entity. What does MVP3 do with the label: keep it as a separate label, turn it into a City, or remove it? Settle it when MVP3 is refined.
- **2026-10-19 (MVP1 Task 72 — the plural in `Imported 1 team.`):** `app/loadActions.ts` writes its own team plural. `formatTeamCount` lives in `features/components/`. Only `AppShell` in `app/` imports `features/` today, for the routes. Options: an app action imports `formatTeamCount` from `features/`, or the function moves to a lower layer, or the copy stays. Not a blocker. The copy stays until the user decides. Carried over from the MVP1 log.

---

## Decisions log

A short record of resolved judgment calls. This stops a later session from silently re-litigating them. List the newest entry at the top. **Procedure:** log a decision here inline, right when you make it, in the same form as the entries below. This is still how a decision enters this file mid-session. Late in a session, once a task has several inline entries, condense them into one file at `decisions-log/NNN-task-slug.md`. Number the file to match the task number in the status board above, the same way as `docs/tasks/`. Then replace the inline entries here with one line: a link to that file, plus a brief summary of what it covers. This keeps the section a scannable index across every task. The full reasoning for one task then lives in its own file.

**MVP1 decisions still apply.** They are in the archived log and in [`docs/archive/mvp1/decisions-log/`](/docs/archive/mvp1/decisions-log/). An entry here changes an MVP1 decision only when it says so.

**START BELOW, LAST ON TOP:**

- **2026-10-28 (Task 100 — team trigrams):** The user agreed US-09.6. A Blueprint has up to 5 trigrams (A to Z, 0 to 9). An empty list uses one made from the name. A league picks one unique trigram for each team: Tier, then OVR, then fixed lots, with a digit fallback. The wizard picks live, the Edit drawer can fix one, and "Create league" stores it. Mono font. Shown in narrow standings, fixtures, the chart, and the last-5 card. CSV column "Trigrams". Detail in [`docs/tasks/100-team-trigrams.md`](/docs/tasks/100-team-trigrams.md).

- **2026-10-28 (Tasks 100 to 102 — unplanned features):** The user approved the 7 MVP2 items of `docs/unplanned-features-draft.md` as MVP2 scope. Task 100: trigrams. Task 101: the team palette. Task 102: a new epic 12, Standings display (last 5, GF and GA on hover, header hints, chart, position zones). The MVP3 section of the draft stays out of scope. Task 84 waits for these tasks.

- **2026-10-28 (Task 96 — Identity & Provenance refinement):** The user agreed US-11.1 and US-11.2. Key choices: Blueprints and leagues get a permanent UUID. An Instance has none and keeps its Blueprint UUID. The provenance is not shown. A known UUID with the same content skips silently. The "Resolve conflicts" dialog gets "Skip all" and "Import all as new", and each row starts on Skip. A re-import of a deleted Blueprint brings it back with the same UUID. Detail in [`docs/tasks/096-refine-identity-provenance.md`](/docs/tasks/096-refine-identity-provenance.md).

- **2026-10-28 (Task 95 — File Module refinement):** The user agreed US-10.1 to US-10.6. Key choices: League Detail has one export menu (league `.json`, results `.txt`, slug list `.txt`). One league imports from the File screen or a new dashboard "Import league" button. The slug list follows the final ranking. The database export is a `.zip`. MVP2 does not import MVP1 files (converter parked, §12). A league import keeps a known embedded Blueprint with no prompt. Detail in [`docs/tasks/095-refine-file-module.md`](/docs/tasks/095-refine-file-module.md).

- **2026-10-28 (Task 94 — Teams Module refinement):** The user agreed US-09.1, 09.2, 09.4, and 09.5. Key choices: the user can always delete a Blueprint, after a confirm. Leagues keep their Instances, which lose only the Location. A restore is parked (§11). A slug is fixed at create. An icon button with a hint, an `aria-label`, and a confirm makes a new slug. The Instance also copies the slug at add. Detail in [`docs/tasks/094-refine-teams-module.md`](/docs/tasks/094-refine-teams-module.md).

- **2026-10-28 (Task 93 — Team Selection refinement):** The user agreed US-08.1 to US-08.8. Key choices: setup is only the wizard, and "Create league" builds phase 1. So US-01.2 loses the "Setup" badge, and a bad fit disables "Create league". The empty state has "+ Add teams", "Load them all", and a new "Import slug list" (`.txt`, an alert for missing slugs). Edit changes the Instance name, colour, Tier, and OVR, never the Blueprint. The slug stays. The Instance copies these values at add. The league slug list export goes to Task 95. Detail in [`docs/tasks/093-refine-team-selection.md`](/docs/tasks/093-refine-team-selection.md).

- **2026-10-28 (Task 92 — Phase Transition refinement):** The user agreed US-07.1 to US-07.3. Key choices: each phase computes its table from its own results. A "Start phase N" click, with a confirm, starts the next phase when a phase is complete. The earlier phase then locks. This settles the Task 78 open question. Qualifiers show as a highlight on the earlier phase, and a Bracket has its Seed List. Parked: a re-scorinate of a locked phase (§9), and a Qualifiers list for other formats (§10). Detail in [`docs/tasks/092-refine-phase-transition.md`](/docs/tasks/092-refine-phase-transition.md).

- **2026-10-28 (Task 91 — Single Duels refinement):** The user agreed US-06.1. The schedule comes from `generateSingleDuels(teams, rng)`, made and stored at phase start. Pairings follow the team order. Only home and away are random, inside the Task 82 balance rule. Test band: each team home in 40% to 60% of 2,000 seeds for each pairing. The screen shows no home and away count: parked as a debug mode item, `scorinator-future-features.md` §8. Detail in [`docs/tasks/091-refine-single-duels-balancing.md`](/docs/tasks/091-refine-single-duels-balancing.md).

- **2026-10-28 (Task 99 — the team Location label):** The user approved a free-text Location on each Blueprint as MVP2 scope (US-09.3). It is a label, not the MVP3 City. At most 40 characters, optional. It shows in the team drawer, the Teams list, the Select-teams dialog and its search, the setup Teams and Review steps, and as a tooltip in standings, group cards, and tie cards. The CSV gets an optional `Location` column. A file without it keeps the location of an updated team. JSON exports carry it. Detail in [`docs/tasks/099-team-location-label.md`](/docs/tasks/099-team-location-label.md).

- **2026-10-28 (Task 90 — Region Adjacency refinement):** The user dropped US-05.1. MVP2 has no Regions, and MVP3 Location Management has the same story. The adjacency rule stays in the specs. In MVP2, the user can move teams between groups by hand (US-02.5). Detail in [`docs/tasks/090-refine-region-adjacency.md`](/docs/tasks/090-refine-region-adjacency.md).

- **2026-10-28 (Task 89 — Bracket Phase refinement):** The user agreed US-04.1 to US-04.14. Key choices: a first-phase bracket seeds by a stored `Rng` draw. The tree uses the standard bracket placement (spec changed from simple seed order). "Scorinate bracket" plays only playable ties with no result, so it needs no confirm. Bye changes are allowed at any time, and after the first result a confirm clears every bracket result. A re-scorinate clears the dependent ties only. Round names "Quarter-finals", "Semi-finals". A "Winner" line. Defaults: Single match, away goals off, third place off, single-match final off. Detail in [`docs/tasks/089-refine-bracket-phase.md`](/docs/tasks/089-refine-bracket-phase.md).

- **2026-10-27 (Task 88 — Tiebreak refinement):** The user agreed US-03.1 to US-03.3. Key choices: AET and the tiebreak method exist on Bracket phases only, with AET on and Penalties by default. A drawn replay plays AET when the phase has AET on, then the coin toss. Away goals apply once, after 180 minutes, never after AET. One "Scorinate" click plays the whole tiebreak. The tie card: an asterisk for AET, "· Pens 5-4", a "Replay" score, and "· Coin toss". An `Rng` 50/50 picks the first kicker, with no edge. Detail in [`docs/tasks/088-refine-tiebreak.md`](/docs/tasks/088-refine-tiebreak.md).

- **2026-10-27 (Task 87 — Groups refinement):** The user agreed US-02.1, 02.2, 02.4, and 02.5. US-02.3 (geographic clustering) is Dropped: it needs Regions (MVP3). Key choices: group size or group count, size by default with the value 4 (changed from count at review), size as a maximum. A pure random draw, stored, with an injected `Rng`. Phase 1 groups draw in setup, a later Groups phase at its start. Shuffle and manual moves (drag, or a "Move to group" menu) until Start or the first result. Group cards: W, D, L, GD, Pts, the MVP1 shared place, a qualifier highlight, and a lighter highlight for best-M candidates. Detail in [`docs/tasks/087-refine-groups.md`](/docs/tasks/087-refine-groups.md).

- **2026-10-27 (Task 83 — MVP2 handoff review):** The user decided nine differences between the MVP2 handoff and the epic 01 stories and Task 87 answers. Handoff: full labels in setup, fixed short names ("Round robin", "Group Stage", "Bracket") on cards and in League Detail, the progress badge, and the phase-1 group draw in setup with Shuffle and moves. Kept from the stories: the points pill, the bracket-last prevention, and five items the handoff does not show. Also: group cards show W, D, L, GD, Pts, and the group size is a maximum. Detail in [`docs/tasks/083-mvp2-design-reference.md`](/docs/tasks/083-mvp2-design-reference.md).

- **2026-10-27 (Task 86 — League Format refinement):** The user agreed six stories, US-01.1 to US-01.6. Key choices: the wizard order is Details → Phases → Teams → Review. A league has 1 or more phases, with no cap. The phase step allows add, remove, change format, and move. No custom phase names: the format label names a phase (custom names parked, `scorinator-future-features.md` §7). One points system for the league. An advancement count that does not fit warns in setup and blocks Start. New: a Groups phase can also send the best M of place N + 1. The user types M, and setup suggests the M that gives a power of 2 before a Bracket. Detail in [`docs/tasks/086-refine-league-format.md`](/docs/tasks/086-refine-league-format.md).

- **2026-10-27 (Task 79 — the second-leg host, MVP2 decision 5):** The user chose two rules. (1) The higher seed hosts the second leg of a two-legged tie. A tie winner keeps its seed in later rounds. A toggle to change the host is parked in `scorinator-future-features.md` §6. (2) A two-legged bracket phase gets a single-match final toggle. When on, the final is one match at a neutral venue, and the third-place tie follows the final. Detail in [`docs/tasks/079-second-leg-host.md`](/docs/tasks/079-second-leg-host.md).

- **2026-10-27 (Task 82 — the single duels generator, MVP2 decision 8):** The user chose a new function, `generateSingleDuels(teams, rng)`, with a required `rng`. It shares the circle-method pairing step with `generateRoundRobin`, which does not change. The balance rule for the tests: each team's home and away counts differ by at most 1, and by 0 when the team plays an even number of matches. Home and away are random inside that rule. No streak limit. Detail in [`docs/tasks/082-single-duels-generator.md`](/docs/tasks/082-single-duels-generator.md).

- **2026-10-27 (Task 81 — when OVR is rolled, MVP2 decision 7):** The user chose three rules. (1) An Instance gets its rolled OVR when its Blueprint is added to the league: Select teams, Load them all, or Switch. This replaces the MVP1 roll at Create (Task 13). (2) An OVR override in Edit must stay inside the Instance Tier's range. (3) A Tier change in Edit rolls a new OVR from the new Tier at once. Detail in [`docs/tasks/081-ovr-roll-timing.md`](/docs/tasks/081-ovr-roll-timing.md).

- **2026-10-27 (Task 80 — AET and penalties, MVP2 decision 6):** The user chose three rules. (1) AET: expected goals = the full-match value × 1/3, with the same elasticity as the match. (2) Penalties: kick by kick. Each kick scores with p = 0.75 + 0.10 × (own OVR − opponent OVR) / 100, kept in 0.6 to 0.9. Five kicks each, then sudden death. (3) AET keeps the home boost of a second leg. Penalties use the stored OVRs. The test bands are in [`docs/tasks/080-aet-penalties.md`](/docs/tasks/080-aet-penalties.md).

- **2026-10-27 (Task 78 — qualification, MVP2 decision 4):** The user chose three rules. (1) Last resort: fixed lots from a hash of the league UUID and each team UUID. It replaces roster order. No stored draw and no reset rule. (2) The mini-league runs recursively among the teams still level, as UEFA does, then the last resort. This replaces the MVP1 one-pass rule. (3) Seeding across groups: all group winners take the top seeds, then all runners-up, and so on. Inside each place: points, goal difference, goals for, then the last resort, per match played if group sizes differ. Detail in [`docs/tasks/078-qualification.md`](/docs/tasks/078-qualification.md).

- **2026-10-27 (Task 77 — stable fixture IDs, MVP2 decision 3):** The user chose a position id. Each fixture gets an `id` when its phase starts, built from its position and unique in the league. A result stores the `fixtureId`. Code treats the id as opaque and never parses it. Round robin: `p1.g2.md3.m4`. A phase with no groups uses `g1`. Bracket tie: `p3.r2.t1`, with matches `.leg1`, `.leg2`, and `.replay`. AET and penalties are part of a match result. The final is `p3.r3.final`, not `t1`. A bracket phase gets a third-place toggle, off by default, and that tie is `p3.r3.third`. Detail in [`docs/tasks/077-stable-fixture-ids.md`](/docs/tasks/077-stable-fixture-ids.md).

- **2026-10-27 (Task 76 — the database, MVP2 decision 2):** The user chose five rules. (a) The database lives in a fixed app data folder. The app opens it at start, with no extra screen. (b) Save and Ctrl+S write every unsaved wrapper, then the manifest, manifest last. (c) The app keeps a saved snapshot for each wrapper and one for the manifest, compared by reference, as in MVP1 Task 26. (d) The manifest summary row holds the card fields plus progress: setup, the current phase with its matchday or bracket round, or completed. One pure function computes the row from the league. (e) Export entire database makes one `.zip` file. Detail in [`docs/tasks/076-database.md`](/docs/tasks/076-database.md).

- **2026-10-27 (Task 75 — CSV import matching, MVP2 decision 1):** The user chose two rules. (1) A CSV row whose slug matches a Blueprint updates its Name, Colours, and Tier. A row with a new slug creates a Blueprint. Before the import applies, one confirm dialog shows the counts, for example "4 new, 8 updated. Continue?". Cancel changes nothing. JSON and league imports keep the Skip or Import as new prompt. (2) Blueprint slugs are unique: a second Blueprint with the same name gets the suffix `-2`, a third gets `-3`. Detail in [`docs/tasks/075-csv-import-matching.md`](/docs/tasks/075-csv-import-matching.md).

- **2026-10-26 (Task 85 — MVP2 workflow directives):** The user set three directives. (1) Each MVP2 epic gets a refinement task (Tasks 86 to 96). The refined stories go in `docs/user-stories/mvp2/`, one file for each epic, with story IDs `US-NN.M`. The acceptance criteria are a plain checklist. Given / When / Then is parked, to check again if the checklists turn out too loose. (2) The status board Notes column stays short. The detail goes in one task file for each task, in `docs/tasks/`. This file replaces `progress-reports/` for MVP2, so the empty root `progress-reports/` folder is gone, and report 074 moved to `docs/tasks/`. (3) Every activity is a task: an unplanned request gets a row and a task file, with agreed criteria, before the work starts. `CLAUDE.md` gets one line about (3), with the user's OK.

- **2026-10-26 (Task 74 — spec edits):** The user approved all 8 edits as written in [`docs/tasks/074-spec-edits.md`](/docs/tasks/074-spec-edits.md). Key results for MVP2 work: single-match ties, their extra time, and replays are at a neutral venue, but a tie still stores a venue value. The coin toss is a pure 50/50. An MVP2 Blueprint has no City and no Crest. Each MVP2 league is its own Instance Wrapper, so two leagues never share an Instance or a live state.

- **2026-10-26 (Sprint 0 — the MVP2 log):** The user chose to archive all MVP1 history in `docs/archive/mvp1/`: the MVP1 `PROGRESS.md`, `progress-reports/`, `decisions-log/`, and `mvp1-first-tasks.md`. The links inside the archive now point to the new paths. MVP2 starts with empty `progress-reports/` and `decisions-log/` folders at the root. MVP2 task numbers continue from 74, so each task number stays unique in code comments. The Open questions hold the 8 open decisions of the impact review §4 and the one open MVP1 question. Claude drafted the sprint 0 rows (Tasks 74 to 84).
