# Scorinator — Progress Log

Read this file first, every session, before touching code or specs. See `CLAUDE.md` for the rules this log is enforcing.

---

## Current approved scope

**MVP1 and MVP2 only.** MVP3/MVP4 specs exist for context but are not approved for implementation. Do not build anything from them. This line is the single source of truth for scope — if it still says MVP1/2 only, that's current even if a task description elsewhere seems to imply more.

---

## Status board

One row per task. Keep this table current — it's the first thing a new session reads to know where things stand. `Report` links to a file in `/progress-reports/` for anything non-trivial (see §"Session reports" below); trivial tasks can just use the Notes column instead of a report file.

| # | Task | Module | Status | Started | Completed | Report | Notes |
|---|------|--------|--------|---------|-----------|--------|-------|
| 0 | Extract design-system: tokens + primitives from design brief + Claude Design handoff bundle (see CLAUDE.md §4) | `design-system/` | ⬜ Not started | | | | Needs the handoff bundle placed in the repo first — see note below. |
| 1 | Repo scaffold: module folders per `module-boundaries` doc, vitest config | `/` | ⬜ Not started | | | | |
| 2 | Tier→OVR range mapping + roll logic | `engine/tier-ovr` | ⬜ Not started | | | | |
| 3 | Two-way round-robin fixture generation (incl. odd-team bye) | `engine/fixtures` | ⬜ Not started | | | | |
| 4 | Standings calc (configurable points, live update) | `engine/standings` | ⬜ Not started | | | | |
| 5 | Scorination: OVR diff + absolute OVR + elasticity → Poisson score | `engine/scorination` | ⬜ Not started | | | | |
| 6 | Home advantage OVR boost | `engine/scorination` | ⬜ Not started | | | | |
| 7 | Re-scorinate (MVP1: no cascade, just overwrite + recalc) | `engine/scorination` | ⬜ Not started | | | | |
| 8 | Team CSV import/export (MVP1 columns) | `adapters/csv` | ⬜ Not started | | | | |
| 9 | Save/Load JSON (MVP1 flat format — predates wrapper split) | `adapters/json-io` | ⬜ Not started | | | | |
| 10 | Results .txt export | `adapters/json-io` or new | ⬜ Not started | | | | |
| 11+ | *(MVP2 tasks — add once MVP1 engine work is stable; don't pre-populate speculatively)* | | | | | | |

**Note on Task 0:** Task 0 (`design-system/` extraction) doesn't block Tasks 1–3 in principle — the engine layer has no dependency on it — but it does block any `features/` work, so it's numbered first as a reminder to do it before UI wiring starts, not necessarily before engine tasks. Place the Claude Design handoff bundle export somewhere in the repo (e.g. `/docs/design-reference/`) before starting Task 0, and note the actual path in that task's report once done — this file will otherwise assume it isn't confirmed yet.

**Status legend:** ⬜ Not started · 🟨 In progress · 🟧 Blocked (needs input — see Open Questions) · ✅ Done

Don't reorder or renumber completed rows. Add new tasks at the bottom of their MVP block as they're identified — the MVP1 task list linked below is a starting point, not exhaustive; sessions should add rows for anything they discover is needed (e.g. a primitive that turns out to be required earlier than planned).

---

## Session reports

For any task more involved than a one-line fix, write a short report to `/progress-reports/NNN-short-slug.md` (numbered to match the task # above) before ending the session, and link it in the Report column. Keep reports brief — a few sentences to a short paragraph each:

- **What was built** — one or two sentences.
- **Test approach** — what's covered, what kind (unit/integration/statistical), anything intentionally left untested and why.
- **Decisions made** — especially anything from a `CLAUDE.md` open item, or any other judgment call a future session should know about rather than rediscover.
- **What's left / what's next** — even for a "done" task, note anything adjacent that was noticed but out of scope for this task.

If a task was stopped without finishing, the report should say so plainly — what's done, what's broken or missing, and what decision or input is needed to continue. A blocked task's report is more important than a finished one's, since it's the thing preventing the next session from re-doing failed work blind.

---

## Open questions

Running list of anything flagged per `CLAUDE.md` open items section that needs a decision from the user before work can proceed on it. Newest at the top. Remove an item once it's resolved and note the resolution inline in the relevant task's report rather than deleting the history silently.

*(none yet)*

---

## Decisions log

Short-form record of resolved judgment calls, so they don't get silently re-litigated by a later session. Newest at top.

*(none yet)*
