# Scorinator — Progress Log (MVP3 preparation)

Read this file first, every session. Read it before you touch code or specs. See `CLAUDE.md` for the rules this log enforces.

Earlier logs are archived and read only. Read them when a task needs history: a decision, a report, or the reason for a choice.

- MVP1 (Tasks 0 to 73): [`docs/archive/mvp1/PROGRESS.md`](/docs/archive/mvp1/PROGRESS.md), with its reports and decision files.
- MVP2 (Tasks 74 to 191): [`docs/archive/mvp2/PROGRESS.md`](/docs/archive/mvp2/PROGRESS.md), with its task files in [`docs/archive/mvp2/tasks/`](/docs/archive/mvp2/tasks/).

---

## Current approved scope

**MVP1, MVP2, and the Must items of MVP3.** MVP1 and MVP2 are complete, and their logs are archived. The user approved the MVP3 Must items for the build on 2026-11-13 (Task 204). These Agreed stories are in scope:

- Season (C1 to C5): US-13.1 to US-13.9, and US-13.11.
- Team condition (C10): US-14.1 to US-14.4.
- Teams module (C36, C44): US-15.1 to US-15.6, and US-15.8.
- League and Season lists (C21, C45, C46): US-16.1 to US-16.5.

Not approved for the build: the MVP3 Should items (US-13.10, US-15.7, C23, and epics 17 to 19), the MVP3 Could items, and MVP4. Their refinement stays allowed. Do not build anything from them. This line is the single source of truth for scope. If it does not name an item, treat the item as not approved, even when a task description elsewhere seems to imply more.

---

## Status board

One row for each task. Keep this table current. A new session reads this table first, to see where things stand.

**Every activity is a task.** When the user asks for work that no row covers, add a row first, with "Task created by User - <date>" in the Notes. Then write its task file with the goal and the acceptance criteria. Agree them with the user before the work starts. A small request gets a small task, not an exception.

**Keep the Notes column short:** one line, about 20 words at most. Use it for where the task stands, what it waits for, or what it depends on. Write the detail in the task file (see Task files below), and link the file in the Task file column.

Do not mark a task as Done until the user gives feedback and agrees with what was delivered. The user can ask for adjustments during Review. After the implementation, mark the task as "Review". When the user agrees, commit the work, and mark it "Refactor". After the refactor pass and its review, mark it "Done", set the Completed date, and commit the refactor. A task with no code goes from Review to Done. See "The refactor step" in [`docs/tdd.md`](/docs/tdd.md) and the Git commits section of `CLAUDE.md`.

| # | Task | Module | Status | Started | Completed | Task file | Notes |
|---|------|--------|--------|---------|-----------|-----------|-------|
| 192 | Archive the MVP2 log: `PROGRESS.md`, the task files, the decisions | `PROGRESS.md`, `docs/` | ✅ Done | 2026-11-11 | 2026-11-11 | [192](/docs/tasks/192-archive-mvp2-log.md) | Task created by User - 2026-11-11. MVP3 preparation, step 1. The user reviewed the new log. |
| 193 | Workflow: a refactor step before Done, with its own review and commit | `CLAUDE.md`, `PROGRESS.md`, `docs/` | ✅ Done | 2026-11-11 | 2026-11-11 | [193](/docs/tasks/193-refactor-step.md) | Task created by User - 2026-11-11. MVP3 preparation, step 2. The user reviewed the docs. |
| 194 | Rewrite the code review checklist: today's standards and module map, a link from each entry to its rule, the local docs entry | `docs/` | ✅ Done | 2026-11-11 | 2026-11-11 | [194](/docs/tasks/194-review-checklist.md) | Task created by User - 2026-11-11. From Task 193, choice 10. 59 entries, 60 links. The user reviewed it. |
| 195 | Define the MVP3 scope: one candidate table, the user's marks, the spec, the refinement tasks | `docs/` | ✅ Done | 2026-11-11 | 2026-11-11 | [195](/docs/tasks/195-mvp3-scope.md) | Task created by User - 2026-11-11. MVP3 preparation, step 3. Spec rewritten, Tasks 196 to 202 added. |
| 196 | Refine epic 13, Season: refined stories in `docs/user-stories/mvp3/13-season.md` | `docs/user-stories` | ✅ Done | 2026-11-11 | 2026-11-12 | [196](/docs/tasks/196-refine-season.md) | From Task 195. US-13.1 to 13.11 Agreed. The user reviewed the task. |
| 197 | Refine epic 14, Team condition: refined stories in `docs/user-stories/mvp3/14-team-condition.md` | `docs/user-stories` | ✅ Done | 2026-11-12 | 2026-11-12 | [197](/docs/tasks/197-refine-team-condition.md) | From Task 195. US-14.1 to 14.4 Agreed. The user reviewed the task. The display place stays open. |
| 198 | Refine epic 15, Teams module: refined stories in `docs/user-stories/mvp3/15-teams-module.md` | `docs/user-stories` | ✅ Done | 2026-11-12 | 2026-11-12 | [198](/docs/tasks/198-refine-teams-module.md) | From Task 195. US-15.1 to 15.8 Agreed. The user reviewed the task. |
| 199 | Refine epic 16, League and Season lists: refined stories in `docs/user-stories/mvp3/16-league-season-lists.md` | `docs/user-stories` | ✅ Done | 2026-11-12 | 2026-11-12 | [199](/docs/tasks/199-refine-league-season-lists.md) | From Task 195. US-16.1 to 16.5 Agreed. C23 waits. The user reviewed the task. |
| 200 | Refine epic 17, Brackets and phases: refined stories in `docs/user-stories/mvp3/17-brackets-phases.md` | `docs/user-stories` | ⬜ Not started |  |  |  | From Task 195. C25, C27, C29 (Should). The user answers questions, Claude does not propose. |
| 201 | Refine epic 18, Debug mode: refined stories in `docs/user-stories/mvp3/18-debug-mode.md` | `docs/user-stories` | ⬜ Not started |  |  |  | From Task 195. C16 (Should). The user answers questions, Claude does not propose. |
| 202 | Refine epic 19, Fixes and polish: refined stories in `docs/user-stories/mvp3/19-fixes-polish.md` | `docs/user-stories` | ⬜ Not started |  |  |  | From Task 195. C19 (Should). The user answers questions, Claude does not propose. |
| 203 | Revise epic 14, Team condition, with the user's notes of 2026-11-13 | `docs/user-stories` | ✅ Done | 2026-11-13 | 2026-11-13 | [203](/docs/tasks/203-revise-team-condition.md) | Task created by User - 2026-11-13. US-14.1 to 14.4 and US-13.8 Agreed. The user reviewed the task. |
| 204 | Approve MVP3 for the build, Must items only: the scope line, `CLAUDE.md` | `PROGRESS.md`, `CLAUDE.md` | ✅ Done | 2026-11-13 | 2026-11-13 | [204](/docs/tasks/204-approve-mvp3-must.md) | Task created by User - 2026-11-13. Scope line, `CLAUDE.md`, and two stale notes changed. The user reviewed the task. |

**Status legend:** ⬜ Not started · 🟨 In progress · 🟧 Blocked (needs input, see Open Questions) · 🟩 Review · 🟦 Refactor (the pass, or its review: the Notes say which) · ✅ Done · ❌ Cancelled (the reason is in the Notes column)

**Note on numbering:** task numbers continue across all logs: MVP1 ends at Task 73, and MVP2 at Task 191. Code comments and docs name tasks by number, for example "(Task 30)", so each number must stay unique. A task number below 192 is in an archive.

Do not reorder or renumber completed rows. Add a new task at the bottom of the table as soon as you identify it.

---

## Task files

Each task has one file in `docs/tasks/`, named `NNN-short-slug.md`. It holds the goal, the acceptance criteria, the notes, and the report. See [`docs/tasks/README.md`](/docs/tasks/README.md) for the rules and the template. Create the file when the task starts, at the latest. Write the report before the task goes to Review.

If a task stops before it finishes, say so plainly in the report. State what is done, what is broken or missing, and what decision or input the work needs to continue. The report of a blocked task matters more than the report of a finished task. It stops the next session from redoing failed work blind.

---

## User stories

Refined stories live in `docs/user-stories/`, one folder for each MVP and one file for each epic. See [`docs/user-stories/README.md`](/docs/user-stories/README.md) for the story IDs, the template, and the status values. A build task names the story IDs it delivers.

---

## Open questions

A running list of items flagged under the `CLAUDE.md` open items section. Each item needs a decision from the user before work can proceed. List the newest item at the top. Once an item is resolved, remove it from this list. Note the resolution inline in the report of the relevant task. Do not delete the history silently.

These items come from the MVP2 log, because they are still open (Task 192). Task 195 moved the short team name to `scorinator-future-features.md` §26, and closed the Location label question (the label stays, MVP3 adds no City).

- **2026-10-29 (user idea, after MVP2 — the OVR form and the MVP4 scope):** Not a task yet. Refine it after the MVP2 features are done. (1) A new feature between MVP2 and MVP3: an optional form for each team in a league, later in a season. A buff or debuff, a peak or a crisis, raises or lowers the team OVR in that league only. The post-league slug list export (US-10.5) can carry it. (2) The user thinks about a drop of MVP4 (Story Mode), for simpler alternatives with fewer fixed rules. The slug list export is a manual season link. No spec change until the user decides. (3) Lower priority than (1): a "push" action that copies the Instances of a league to the database. It creates a Blueprint for a new team, or overwrites the Blueprint of a known one.
- **2026-10-19 (MVP1 Task 72 — the plural in `Imported 1 team.`):** `app/loadActions.ts` writes its own team plural. `formatTeamCount` lives in `features/components/`. Only `AppShell` in `app/` imports `features/` today, for the routes. Options: an app action imports `formatTeamCount` from `features/`, or the function moves to a lower layer, or the copy stays. Not a blocker. The copy stays until the user decides. Carried over from the MVP1 log.

---

## Decisions log

A short record of resolved judgment calls. This stops a later session from silently re-litigating them. List the newest entry at the top. **Procedure:** log a decision here inline, right when you make it, in the same form as the entries below. This is still how a decision enters this file mid-session. Late in a session, once a task has several inline entries, condense them into one file at `decisions-log/NNN-task-slug.md`. Number the file to match the task number in the status board above, the same way as `docs/tasks/`. Then replace the inline entries here with one line: a link to that file, plus a brief summary of what it covers. This keeps the section a scannable index across every task. The full reasoning for one task then lives in its own file.

**MVP1 and MVP2 decisions still apply.** They are in [`docs/archive/mvp1/PROGRESS.md`](/docs/archive/mvp1/PROGRESS.md), [`docs/archive/mvp1/decisions-log/`](/docs/archive/mvp1/decisions-log/), and [`docs/archive/mvp2/PROGRESS.md`](/docs/archive/mvp2/PROGRESS.md). An entry here changes an earlier decision only when it says so.

**START BELOW, LAST ON TOP:**

- **2026-11-13 (Task 204 — MVP3 approved, Must items only):** The user approved the MVP3 Must items for the build: US-13.1 to 13.9, US-13.11, US-14.1 to 14.4, US-15.1 to 15.6, US-15.8, and US-16.1 to 16.5. US-15.8 has no C item, and the user put it in. The Should items, the Could items, and MVP4 stay out. The scope line and `CLAUDE.md` changed. The open item on the MVP3 Instance-scoping wording is closed, in `CLAUDE.md` and `PERSISTENCE.md` §2a: the Task 195 rewrite uses "Instance Wrapper". Detail: [Task 204](/docs/tasks/204-approve-mvp3-must.md).

- **2026-11-13 (Task 203 — the condition amount and place):** The user changed US-14.1: each level is a fixed percentage of the base OVR, not a random range. +1 and +2 are +10% and +20%, rounded up. -1 and -2 are -10% and -20%, rounded down. A base OVR change changes the amount. League Detail gets both a "Teams" tab and a modal for the condition. This closes the open question of Task 197. For a running league, the Season "Resume" tab shows the team in first place and the teams in the zones (US-13.8). Detail: [Task 203](/docs/tasks/203-revise-team-condition.md).

- **2026-11-12 (Task 199 — Must items first):** The user starts the MVP3 development with the Must items only. A Should item keeps its rank, and its refinement can wait. C23 waits. No spec change. Tasks 200 to 202 cover Should items only. Detail: [Task 199](/docs/tasks/199-refine-league-season-lists.md).

- **2026-11-12 (Task 198 — the colour modal):** The user approved a spec edit in `scorinator-mvp3.md` §1 Teams module: the custom colour is a "Colour" modal with three rows, "Cancel", and "OK". The §2 open item on the picker design is closed. Detail: [Task 198](/docs/tasks/198-refine-teams-module.md).

- **2026-11-12 (Task 197 — the condition scope):** The user approved a spec change in `scorinator-mvp3.md` §1 Team condition: the condition is for one team in one league, in a Season or standalone, and for a playoff team. It said "for the Season". Detail: [Task 197](/docs/tasks/197-refine-team-condition.md).

- **2026-11-12 (Task 196 — the league UUID scope):** The user approved a spec line in `scorinator-mvp3.md` §1: a league UUID is unique in its container, the standalone leagues or one Season. A shared UUID means the two leagues are related (US-13.10). Only the Season can be a conflict in a Season import. Detail: [Task 196](/docs/tasks/196-refine-season.md).

- **2026-11-12 (Task 196 — the Season storage):** A Season stays one wrapper file in the database folder, with its roster and all its leagues (`PERSISTENCE.md` §2a, unchanged). The user chose it over one folder for each Season: consistent saves and one shared roster. Detail: [Task 196](/docs/tasks/196-refine-season.md).

- **2026-11-11 (Task 195 — the MVP3 scope):** The user cut the MVP3 spec to Season and the custom team colour, and ranked 27 candidates: 12 Must, 8 Should, 5 Could, 2 Later. 19 candidates are discarded. Seven epics, numbered 13 to 19 so the story IDs stay unique. The Season playoffs are named single matches of the Season. The team condition buffs or nerfs a team for the Season, with no Tier change. The Location stays a label. The refinement asks the user, and does not propose. The scope line stays MVP1 and MVP2 until the user approves MVP3. Detail: [Task 195](/docs/tasks/195-mvp3-scope.md).

- **2026-11-11 (Task 194 — the review checklist):** The user agreed eight choices. One short line for each entry, with a link to its rule. The first section: the local docs of each module or feature in the diff. Thirteen sections by what the diff holds. Scope entries point to the `PROGRESS.md` scope line. The refactor pass items in the process section. Detail: [Task 194](/docs/tasks/194-review-checklist.md).

- **2026-11-11 (Task 193 — the refactor step):** The user agreed eleven choices. A 🟦 Refactor status between Review and Done. Commit 1 at the review, commit 2 for the refactor. The pass reads the review checklist first, against the diff of the task. Every change after the implementation happens during Review: at Refactor, only plain refactoring. Gaps outside the diff and bugs go in the task notes. A task with no code skips the step. Task 194 rewrites the checklist. Rule text: `docs/tdd.md`, "The refactor step". Detail: [Task 193](/docs/tasks/193-refactor-step.md).

- **2026-11-11 (Task 192 — the MVP2 archive):** The user agreed nine choices. (1) The log moves to `docs/archive/mvp2/PROGRESS.md`. (2) The task files 074 to 191 move to `docs/archive/mvp2/tasks/`. (3) The links follow them. (4) The MVP1-to-MVP2 impact review moves to `docs/archive/mvp2/`. (5) The MVP2 user stories stay. (6) A new log with the same rules, and the scope line unchanged. (7) The open questions carry over. (8) A new, empty decisions log. (9) Numbers go on from 193. Detail: [Task 192](/docs/tasks/192-archive-mvp2-log.md).
