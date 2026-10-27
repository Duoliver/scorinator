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
| 83 | MVP2 design reference: add the Claude Design handoff bundle for MVP2 at `docs/design-reference/MVP2/`, or decide to build the MVP2 screens without one | `docs/design-reference` | 🟩 Review | 2026-10-27 |  | [083](/docs/tasks/083-mvp2-design-reference.md) | Sprint 0. Handoff added. Review against Tasks 86 and 87 done: D1 to D9 decided. Waits for user review. |
| 84 | Split the MVP2 epics into build task rows, in build order | `PROGRESS.md` | ⬜ Not started |  |  |  | Sprint 0. Do it last, after the refinement Tasks 86 to 96. |
| 85 | MVP2 workflow directives: refined user stories in their own files, short status board notes with detail in a task file, and one task for every activity | `PROGRESS.md`, `docs/` | ✅ Done | 2026-10-26 | 2026-10-26 | [085](/docs/tasks/085-workflow-directives.md) | Task created by User - 2026-10-26. |
| 86 | Refine epic 01, League Format Configuration: refined stories in `docs/user-stories/mvp2/01-league-format.md` | `docs/user-stories` | ✅ Done | 2026-10-27 | 2026-10-27 | [086](/docs/tasks/086-refine-league-format.md) | Sprint 0. Six stories Agreed (US-01.1 to US-01.6). One spec line added. |
| 87 | Refine epic 02, Groups: refined stories in `docs/user-stories/mvp2/02-groups.md` | `docs/user-stories` | 🟨 In progress | 2026-10-27 |  | [087](/docs/tasks/087-refine-groups.md) | Sprint 0. Handoff answers added (Task 83). Two gaps left: move mode, lots display. |
| 88 | Refine epic 03, Tiebreak Configuration: refined stories in `docs/user-stories/mvp2/03-tiebreak-configuration.md` | `docs/user-stories` | ⬜ Not started |  |  |  | Sprint 0. Related decision: 6 (Task 80). |
| 89 | Refine epic 04, Bracket Phase: refined stories in `docs/user-stories/mvp2/04-bracket-phase.md` | `docs/user-stories` | ⬜ Not started |  |  |  | Sprint 0. Related decisions: 3, 4, and 5 (Tasks 77, 78, 79). Also the bracket round names (Task 76), the third-place toggle (Task 77). |
| 90 | Refine epic 05, Region Adjacency: refined stories in `docs/user-stories/mvp2/05-region-adjacency.md` | `docs/user-stories` | ⬜ Not started |  |  |  | Sprint 0. Check the MVP3 Location scope line first. |
| 91 | Refine epic 06, Single Duels Home/Away Balancing: refined stories in `docs/user-stories/mvp2/06-single-duels-balancing.md` | `docs/user-stories` | ⬜ Not started |  |  |  | Sprint 0. Related decision: 8 (Task 82). |
| 92 | Refine epic 07, Phase Transition: refined stories in `docs/user-stories/mvp2/07-phase-transition.md` | `docs/user-stories` | ⬜ Not started |  |  |  | Sprint 0. Related decision: 4 (Task 78). Also the card progress text (Task 76). |
| 93 | Refine epic 08, Team Selection in League Setup: refined stories in `docs/user-stories/mvp2/08-team-selection.md` | `docs/user-stories` | ⬜ Not started |  |  |  | Sprint 0. Related decision: 7 (Task 81). |
| 94 | Refine epic 09, Teams Module (Blueprints): refined stories in `docs/user-stories/mvp2/09-teams-module.md` | `docs/user-stories` | ⬜ Not started |  |  |  | Sprint 0. Related decisions: 1 and 7 (Tasks 75, 81). |
| 95 | Refine epic 10, File Module: refined stories in `docs/user-stories/mvp2/10-file-module.md` | `docs/user-stories` | ⬜ Not started |  |  |  | Sprint 0. Related decisions: 1 and 2 (Tasks 75, 76). |
| 96 | Refine epic 11, Identity & Provenance: refined stories in `docs/user-stories/mvp2/11-identity-provenance.md` | `docs/user-stories` | ⬜ Not started |  |  |  | Sprint 0. Related decision: 1 (Task 75). |
| 97 | Fix the `docs/tdd` link in `CLAUDE.md`, and check the other repo links | `CLAUDE.md`, `docs/` | ✅ Done | 2026-10-26 | 2026-10-26 | [097](/docs/tasks/097-tdd-link.md) | Task created by User - 2026-10-26. |
| 98 | Reword the decision rows: "Can close inside Task X" becomes "Related epics: … One of them can settle this decision." | `PROGRESS.md` | ✅ Done | 2026-10-26 | 2026-10-26 | [098](/docs/tasks/098-decision-row-wording.md) | Task created by User - 2026-10-26. |

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

- **2026-10-27 (Task 78, for Task 92 — re-scorinate after the next phase starts):** Can the user re-scorinate a match of a finished phase after the next phase starts? If so, the qualifiers and seeds can change. One option: an earlier phase locks when the next phase starts. Settle it in Task 92.
- **2026-10-19 (MVP1 Task 72 — the plural in `Imported 1 team.`):** `app/loadActions.ts` writes its own team plural. `formatTeamCount` lives in `features/components/`. Only `AppShell` in `app/` imports `features/` today, for the routes. Options: an app action imports `formatTeamCount` from `features/`, or the function moves to a lower layer, or the copy stays. Not a blocker. The copy stays until the user decides. Carried over from the MVP1 log.

---

## Decisions log

A short record of resolved judgment calls. This stops a later session from silently re-litigating them. List the newest entry at the top. **Procedure:** log a decision here inline, right when you make it, in the same form as the entries below. This is still how a decision enters this file mid-session. Late in a session, once a task has several inline entries, condense them into one file at `decisions-log/NNN-task-slug.md`. Number the file to match the task number in the status board above, the same way as `docs/tasks/`. Then replace the inline entries here with one line: a link to that file, plus a brief summary of what it covers. This keeps the section a scannable index across every task. The full reasoning for one task then lives in its own file.

**MVP1 decisions still apply.** They are in the archived log and in [`docs/archive/mvp1/decisions-log/`](/docs/archive/mvp1/decisions-log/). An entry here changes an MVP1 decision only when it says so.

**START BELOW, LAST ON TOP:**

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
