# Scorinator — Progress Log

Read this file first, every session. Read it before you touch code or specs. See `CLAUDE.md` for the rules this log enforces.

---

## Current approved scope

**MVP1 and MVP2 only.** MVP3 and MVP4 specs exist for context. They are not approved for implementation. Do not build anything from them. This line is the single source of truth for scope. If it still says MVP1/2 only, treat that as current, even when a task description elsewhere seems to imply more.

---

## Status board

One row for each task. Keep this table current. A new session reads this table first, to see where things stand. The Report column links to a file in `/progress-reports/` for any non-trivial task (see the Session reports section below). A trivial task can use the Notes column instead of a report file.

| # | Task | Module | Status | Started | Completed | Report | Notes |
|---|------|--------|--------|---------|-----------|--------|-------|
| 0 | Extract design-system: tokens + primitives from design brief + Claude Design handoff bundle (see `docs/design-reference`) | `design-system/` | ✅ Done | 2026-09-02 | 2026-09-02 | [000](/progress-reports/000-design-system-extraction.md) | Added minimal vitest and jsdom scaffolding, a subset of Task 1, because the primitives need their own tests. |
| 1 | Repo scaffold: module folders per `module-boundaries` doc, vitest config | `/` | ✅ Done | 2026-09-02 | 2026-09-04 | | Scoped to MVP1 folders only. See the decision below. |
| 2 | Tier→OVR range mapping + roll logic | `engine/tier-ovr` | ✅ Done | 2026-09-04 | 2026-09-04 | [002](/progress-reports/002-tier-ovr.md) | Added `engine/rng.ts` (shared seeded RNG) as a prerequisite. |
| 3 | Two-way round-robin fixture generation (incl. odd-team bye) | `engine/fixtures` | ✅ Done | 2026-09-04 | 2026-09-04 | [003](/progress-reports/003-round-robin-fixtures.md) | Rejects N < 2 with a `RangeError` — flagged decision, see report. |
| 4 | Standings calc (configurable points, live update) | `engine/standings` | ✅ Done | 2026-09-04 | 2026-09-04 | [004](/progress-reports/004-standings.md) | Tie-break: points, GD, GF, mini-league, roster order. Adds `sortOrder`/`position`/`positionText` — see report. |
| 5 | Scorination: OVR diff + absolute OVR + elasticity → Poisson score | `engine/scorination` | ⬜ Not started | | | | |
| 6 | Home advantage OVR boost | `engine/scorination` | ⬜ Not started | | | | |
| 7 | Re-scorinate (MVP1: no cascade, just overwrite + recalc) | `engine/scorination` | ⬜ Not started | | | | |
| 8 | Team CSV import/export (MVP1 columns) | `adapters/csv` | ⬜ Not started | | | | |
| 9 | Save/Load JSON (MVP1 flat format — predates wrapper split) | `adapters/json-io` | ⬜ Not started | | | | |
| 10 | Results .txt export | `adapters/json-io` or new | ⬜ Not started | | | | |
| 11 | Team ID/slug generation — `slug()` only, no UUID or provenance yet | `engine/identity` | ⬜ Not started | | | | First slice of the MVP2 identity module. Build only the slug function now. |
| 12 | Team Management screen: create/edit team form, CSV import, CSV export | `features/teams` | ⬜ Not started | | | | Needs Task 8 (CSV) and Task 11 (slug). |
| 13 | League Setup screen: create league, home-advantage toggle, points config, add teams | `features/leagues` | ⬜ Not started | | | | No engine blocker. Full save needs Task 9. |
| 14 | Fixtures view: generate and show matchdays | `features/fixtures` | ⬜ Not started | | | | Engine ready. Task 3 is done. |
| 15 | Scorination UI: scorinate one match, scorinate a full matchday, re-scorinate | `features/scorination` | ⬜ Not started | | | | Needs Tasks 5, 6, and 7. |
| 16 | Standings table: live view | `features/standings` | ⬜ Not started | | | | Needs Task 4. |
| 17 | Save/Load UI | `features/persistence` | ⬜ Not started | | | | Needs Task 9. |
| 18 | Results export (.txt) UI | `features/persistence` | ⬜ Not started | | | | Needs Task 10. |
| 19+ | *(MVP2 UI tasks. Add these once MVP1 UI work is stable.)* | | | | | | |


**Note on Task 0:** Task 0 (`design-system/` extraction) does not block Tasks 1 through 3. The engine layer has no dependency on it. Task 0 does block any `features/` work. It is numbered first as a reminder to do it before UI wiring starts, not necessarily before engine tasks. The Claude Design handoff bundle export for MVP1 sits at `/docs/design-reference/MVP1`. See its own `README.md` for more on how to use it.

**Status legend:** ⬜ Not started · 🟨 In progress · 🟧 Blocked (needs input, see Open Questions) · ✅ Done

Do not reorder or renumber completed rows. Add a new task at the bottom of its MVP block as soon as you identify it. The MVP1 task list in the table above is a starting point, not a full list. A session should add a row for anything it finds it needs, for example a primitive that turns out to be required earlier than planned.

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

*(none yet)*

---

## Decisions log

A short record of resolved judgment calls. This stops a later session from silently re-litigating them. List the newest entry at the top.

**Procedure:** log a decision here inline, right when you make it, in the same form as the entries below. This is still how a decision enters this file mid-session. Late in a session, once a task has several inline entries, condense them into one file at `decisions-log/NNN-task-slug.md`. Number the file to match the task number in the status board above, the same way as `progress-reports/`. Then replace the inline entries here with one line: a link to that file, plus a brief summary of what it covers. This keeps the section a scannable index across every task. The full reasoning for one task then lives in its own file.

- **2026-09-03 (Task 0):** See [`decisions-log/000-design-system-extraction.md`](/decisions-log/000-design-system-extraction.md). That file first covered the `Tabs` self-contained active-tab-state design, the `--color-fg-muted` AAA contrast exception, the exclusion of the 16-colour team palette (MVP3 scope), and the choice of CSS Modules over Tailwind. This session also found and closed several gaps against the "Inputs" section of the Foundations reference. It fixed a `Button` cascade bug. It removed `!important` project-wide. This is now prohibited, and `coding-standards.md` documents the rule. It added numeric styling to `Input`. It built new `Select`, `Checkbox`, and `Switch` primitives. It then migrated `Input`, `Select`, `Checkbox`, and `Switch` from controlled `value`/`onChange` props to an uncontrolled, `ref`-exposed `FieldHandle<T>` (`getValue`, `setValue`, `subscribe`, `focus`). This gives each field its own internal state, instead of parent-owned form state. The `subscribe()` method lets the render of one field depend on the value of another field, without a form engine.
- **2026-09-04 (Task 1):** Created only the MVP1 folders from `module-boundaries.md`. These are `engine/tier-ovr`, `engine/fixtures`, `engine/scorination`, `engine/standings`, `adapters/tauri-fs`, `adapters/csv`, and `adapters/json-io`. Each folder has a `.gitkeep` file. Git does not track empty directories. Did not create `engine/bracket`, `engine/tiebreak`, or `engine/identity` (MVP2). Did not create `engine/locations` or `engine/story-mode` (MVP3/4, out of scope). Did not create `features/` or `app/` (no active work there yet). Reason: `module-boundaries.md` says do not scaffold a module that is not under active build. The status board also defers MVP2 task rows until MVP1 work is stable. Create each remaining folder when its first task starts.
- **2026-09-04 (Task 2):** See [`progress-reports/002-tier-ovr.md`](/progress-reports/002-tier-ovr.md) for the full report. The spec names only one Tier→OVR range anchor, S = 90-99, and calls the rest a default without a listed table. This session proposed seven even, non-overlapping 10-point bands (S 90-99 through F 30-39), flagged as a balancing detail rather than picked silently. Also added `engine/rng.ts`, a shared seeded RNG (`Rng` type plus `createSeededRng`), at the root of `engine/` rather than inside `tier-ovr/`, since ENGINE.md requires injected RNG in several future modules, not only this one.
- **2026-09-04 (Task 3):** See [`progress-reports/003-round-robin-fixtures.md`](/progress-reports/003-round-robin-fixtures.md) for the full report. `generateRoundRobin(teams)` in `engine/fixtures` throws a `RangeError` for fewer than 2 teams, an open item the spec does not cover, flagged rather than picked silently — an empty schedule could hide a real caller bug, such as a league with no teams. The function needs no RNG, since fixture generation is not stochastic. It takes a generic `TeamId`, not a `Team` domain object, since no `Team` entity exists yet in `engine/` or `persistence/`.
- **2026-09-04 (Task 11, pre-work decision):** `engine/identity` is the MVP2 folder for UUID and provenance logic, per `module-boundaries.md`. MVP1 needs a team ID/slug now. Decision: open `engine/identity` early. Build only a plain `slug()` function in it. Do not add UUID generation or import-conflict logic yet. MVP2 adds those to the same folder later. This keeps the module map as-is. It does not pull any MVP2 feature forward — only a small, non-stochastic helper function.
- **2026-09-04 (Task 4):** See [`progress-reports/004-standings.md`](/progress-reports/004-standings.md) for the full report. The spec leaves standings tie-break order unstated. This session first picked the standard football convention: points, then goal difference, then goals for, then roster order, flagged as an open item rather than picked silently. `calculateStandings` throws a `RangeError` for a result naming a team outside the given roster, the same reasoning as Task 3's N < 2 guard. The function recomputes the full table from the full roster and result set on every call, with no running-total state inside the module, which is what makes "live update" and re-scorinate's recalculation work at this layer.
- **2026-09-04 (Task 4, follow-up):** The user asked for a head-to-head tie-break step, ahead of roster order: points, goal difference, goals for, then the result of the matches between the two tied teams (most wins decides; a 1-1 split or zero matches falls to the aggregate goals scored between them), then roster order as the last resort. Implemented in `compareRows` and a new `compareHeadToHead` helper in `standings.ts`. This is not an open item — the user specified the exact rule — so it needed no separate flag. Roster order stays the final fallback for now, and the user asked to revisit it later.
- **2026-09-04 (Task 4, second follow-up):** The user asked for tied league positions to display correctly. `StandingsRow` gained three fields: `sortOrder` (the row's place in the table, always unique), `position` (the standings rank, shared by rows level on every footballing criterion, including head-to-head), and `positionText` (`position` as a string on the first row of a tied block, `'-'` on the rest). Proposed `sortOrder` as a name for the first field, since the user asked for a better one than "order"; open to a different name.
- **2026-09-04 (Task 4, third follow-up):** The user asked how professional leagues resolve a head-to-head cycle among three or more tied teams (A beats B, B beats C, C beats A, no consistent pairwise order), and whether a cyclic group could just be declared fully tied. This session replaced the pairwise head-to-head check with a mini-league: a fresh points/goal-difference/goals-for table, computed only from matches among a tied group's own members, the method UEFA, La Liga, and Serie A use. This fixes a real bug, not only a cosmetic one — `assignPositions` assumed "tied" was transitive, so a cycle could give a different, sort-order-dependent table on the same season data. All 123 prior tests passed unchanged, since a two-team mini-league reduces to the old pairwise result for a genuine pair. One new test adds a real 3-way cycle. Flagged: this runs one mini-league pass per group, not the fully recursive version a professional competition uses when a mini-league only partly separates a group. See `progress-reports/004-standings.md` for the full reasoning.
