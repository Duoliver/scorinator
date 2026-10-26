# Scorinator — Progress Log (MVP2)

Read this file first, every session. Read it before you touch code or specs. See `CLAUDE.md` for the rules this log enforces.

The MVP1 log is archived at [`docs/archive/mvp1/PROGRESS.md`](/docs/archive/mvp1/PROGRESS.md), with its reports and decision files. It is read only. Read it when a task needs MVP1 history: a decision, a report, or the reason for a choice.

---

## Current approved scope

**MVP1 and MVP2 only.** MVP1 is complete, and its log is archived. MVP2 is the current work. MVP3 and MVP4 specs exist for context. They are not approved for implementation. Do not build anything from them. This line is the single source of truth for scope. If it still says MVP1/2 only, treat that as current, even when a task description elsewhere seems to imply more.

---

## Status board

One row for each task. Keep this table current. A new session reads this table first, to see where things stand. The Report column links to a file in `/progress-reports/` for any non-trivial task (see the Session reports section below). A trivial task can use the Notes column instead of a report file.

Do not mark a task as Done until the user gives feedback and agrees with what was delivered. The user can ask for adjustments. After the implementation, mark the task as "Review". Mark it "Done" when the user agrees, and set the Completed date.

| # | Task | Module | Status | Started | Completed | Report | Notes |
|---|------|--------|--------|---------|-----------|--------|-------|
| 74 | Spec and doc edits: apply the 8 edits listed in `docs/mvp1-to-mvp2-impact-review.md` §3 | `docs/` | 🟩 Review | 2026-10-26 |  | [074](/progress-reports/074-spec-edits.md) | Sprint 0. The user owns the spec docs, so each edit needs the user's approval. The edit to the MVP1 Task 32 row no longer applies: the MVP1 log is archived and read only. **Proposal (2026-10-26):** the draft text for each edit is in report 074. It waits for the user's approval. No spec file is changed yet. **Applied (2026-10-26):** the user approved all edits. Edits 1 to 6 are in `docs/scorinator-mvp2.md`, and edit 8 is in `docs/module-boundaries.md`. Edit 7 is dropped. The impact review §3 now says that its list is applied. Docs only, so no test changed. |
| 75 | Settle open decision 1: CSV import matching | `adapters/csv`, `app/data` | ⬜ Not started |  |  |  | Sprint 0. See Open questions. |
| 76 | Settle open decision 2: the database | `persistence/`, `adapters/` | ⬜ Not started |  |  |  | Sprint 0. See Open questions. Five parts. It shapes the MVP1 Tasks 26 and 28 (the unsaved badge and the close prompt). |
| 77 | Settle open decision 3: stable fixture IDs | `engine/round-robin`, `domain/` | ⬜ Not started |  |  |  | Sprint 0. See Open questions. Touches the result lookups, re-scorinate, and the saved result shape. |
| 78 | Settle open decision 4: qualification | `engine/standings` | ⬜ Not started |  |  |  | Sprint 0. See Open questions. |
| 79 | Settle open decision 5: who hosts the second leg of a two-legged tie | `engine/bracket` | ⬜ Not started |  |  |  | Sprint 0. See Open questions. The user deferred it during the impact review. |
| 80 | Settle open decision 6: the AET and penalty models | `engine/scorination`, `engine/tiebreak` | ⬜ Not started |  |  |  | Sprint 0. See Open questions. Each model needs a proposed statistical test band, per `ENGINE.md`. |
| 81 | Settle open decision 7: when OVR is rolled | `engine/tier-ovr`, `app/state` | ⬜ Not started |  |  |  | Sprint 0. See Open questions. |
| 82 | Settle open decision 8: the single duels generator | `engine/round-robin` | ⬜ Not started |  |  |  | Sprint 0. See Open questions. |
| 83 | MVP2 design reference: add the Claude Design handoff bundle for MVP2 at `docs/design-reference/MVP2/`, or decide to build the MVP2 screens without one | `docs/design-reference` | ⬜ Not started |  |  |  | Sprint 0. Only `docs/design-reference/MVP1/` exists today. See `docs/design-reference/README.md` for how a bundle is used. |
| 84 | Split the MVP2 epics (`docs/scorinator-mvp2.md` §2) into task rows, in build order | `PROGRESS.md` | ⬜ Not started |  |  |  | Sprint 0. Do it after Tasks 74 to 83, because the decisions shape the order and the size of each task. One epic or one `design-system/` primitive per task, per `docs/tdd.md`. |

**Status legend:** ⬜ Not started · 🟨 In progress · 🟧 Blocked (needs input, see Open Questions) · 🟩 Review · ✅ Done · ❌ Cancelled (the reason is in the Notes column)

**Note on numbering:** MVP2 task numbers continue from the MVP1 log, which ends at Task 73. Code comments and docs name tasks by number, for example "(Task 30)", so each number must stay unique across both logs. A task number below 74 is an MVP1 task. Find it in the archive.

**Note on sprint 0:** Tasks 74 to 84 are sprint 0. They settle the specs, the open decisions, and the design reference before MVP2 code starts. Claude drafted them on 2026-10-26. The user can edit, reorder, or cancel any of them.

Do not reorder or renumber completed rows. Add a new task at the bottom of the table as soon as you identify it. The MVP2 task list in the table above is a starting point, not a full list. A session should add a row for anything it finds it needs, for example a primitive that turns out to be required earlier than planned.

---

## Session reports

For any task bigger than a one-line fix, write a short report. Save it to `/progress-reports/NNN-short-slug.md`. Number it to match the task number above. Link it in the Report column before you end the session. Keep each report brief, from a few sentences to a short paragraph:

- **What was built:** one or two sentences.
- **Test approach:** what the tests cover, what kind of tests (unit, integration, statistical), and anything left untested on purpose, with the reason.
- **Decisions made:** any open item from `CLAUDE.md`, and any other judgment call a future session needs, so it does not redo the work.
- **What is left, what is next:** for a done task too, note anything nearby that you saw but left out of scope.

If a task stops before it finishes, say so plainly in the report. State what is done, what is broken or missing, and what decision or input the work needs to continue. The report of a blocked task matters more than the report of a finished task. It stops the next session from redoing failed work blind.

---

## Open questions

A running list of items flagged under the `CLAUDE.md` open items section. Each item needs a decision from the user before work can proceed. List the newest item at the top. Once an item is resolved, remove it from this list. Note the resolution inline in the report of the relevant task. Do not delete the history silently.

The 8 MVP2 decisions below come from `docs/mvp1-to-mvp2-impact-review.md` §4, which has the full reasoning. Each one needs a decision before the related MVP2 task starts. The numbers are the ones the review uses.

- **2026-10-26 (MVP2 decision 1 — CSV import matching, Task 75):** Keep the slug upsert for CSV only, while JSON and league imports switch to Skip or Import as new? Or prompt for CSV too?
- **2026-10-26 (MVP2 decision 2 — the database, Task 76):** (a) Where the database lives: a fixed app data folder, or a folder the user opens. (b) What Save and Ctrl+S commit: the current wrapper, every dirty wrapper plus the manifest, or everything. (c) Unsaved-changes tracking for each wrapper and for the manifest. This shapes the MVP1 Tasks 26 and 28. (d) What the manifest summary row holds for the dashboard cards. (e) A zip or a directory for the entire-database bundle.
- **2026-10-26 (MVP2 decision 3 — stable fixture IDs, Task 77):** How a fixture gets an identity that survives phases, groups, two-legged ties, and replays. In MVP2, matchday numbers restart in each phase, groups share matchday numbers, and two-legged ties and replays repeat the same pairing. So the `(matchday, home, away)` match key of the MVP1 Task 54 is not enough.
- **2026-10-26 (MVP2 decision 4 — qualification, Task 78):** The tie-break fallback when qualification or seeding depends on it. If lots are drawn, where the draw is stored and when it resets. How to seed across groups.
- **2026-10-26 (MVP2 decision 5 — the second-leg host, Task 79):** Who hosts the second leg of a two-legged tie. The user deferred it, to discuss later. Single-match ties and replays are settled as neutral (impact review §1). A common answer is the higher seed, as in UEFA knockouts.
- **2026-10-26 (MVP2 decision 6 — AET and penalties, Task 80):** A proposed AET goal scaling and a penalty model, each with its statistical test band, per `ENGINE.md`.
- **2026-10-26 (MVP2 decision 7 — when OVR is rolled, Task 81):** The review proposes: at add-to-league, so the Instance Edit can override it before the league starts.
- **2026-10-26 (MVP2 decision 8 — the single duels generator, Task 82):** A new generator, or an extension of `generateRoundRobin`. Shape the `Rng` parameter of the MVP1 Task 30 to fit.
- **2026-10-19 (MVP1 Task 72 — the plural in `Imported 1 team.`):** `app/loadActions.ts` writes its own team plural. `formatTeamCount` lives in `features/components/`. Only `AppShell` in `app/` imports `features/` today, for the routes. Options: an app action imports `formatTeamCount` from `features/`, or the function moves to a lower layer, or the copy stays. Not a blocker. The copy stays until the user decides. Carried over from the MVP1 log.

---

## Decisions log

A short record of resolved judgment calls. This stops a later session from silently re-litigating them. List the newest entry at the top. **Procedure:** log a decision here inline, right when you make it, in the same form as the entries below. This is still how a decision enters this file mid-session. Late in a session, once a task has several inline entries, condense them into one file at `decisions-log/NNN-task-slug.md`. Number the file to match the task number in the status board above, the same way as `progress-reports/`. Then replace the inline entries here with one line: a link to that file, plus a brief summary of what it covers. This keeps the section a scannable index across every task. The full reasoning for one task then lives in its own file.

**MVP1 decisions still apply.** They are in the archived log and in [`docs/archive/mvp1/decisions-log/`](/docs/archive/mvp1/decisions-log/). An entry here changes an MVP1 decision only when it says so.

**START BELOW, LAST ON TOP:**

- **2026-10-26 (Task 74 — spec edits):** The user approved all 8 edits as written in [`progress-reports/074-spec-edits.md`](/progress-reports/074-spec-edits.md). Key results for MVP2 work: single-match ties, their extra time, and replays are at a neutral venue, but a tie still stores a venue value. The coin toss is a pure 50/50. An MVP2 Blueprint has no City and no Crest. Each MVP2 league is its own Instance Wrapper, so two leagues never share an Instance or a live state.

- **2026-10-26 (Sprint 0 — the MVP2 log):** The user chose to archive all MVP1 history in `docs/archive/mvp1/`: the MVP1 `PROGRESS.md`, `progress-reports/`, `decisions-log/`, and `mvp1-first-tasks.md`. The links inside the archive now point to the new paths. MVP2 starts with empty `progress-reports/` and `decisions-log/` folders at the root. MVP2 task numbers continue from 74, so each task number stays unique in code comments. The Open questions hold the 8 open decisions of the impact review §4 and the one open MVP1 question. Claude drafted the sprint 0 rows (Tasks 74 to 84).
