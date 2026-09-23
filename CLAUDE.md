# CLAUDE.md — Scorinator Overview and Implementation Guide

**Scorinator** is a desktop app for building and simulating fictional football (soccer) league ecosystems. Scope ranges from a single round-robin among a handful of teams, up to a full national pyramid with cups and promotion/relegation. It also includes a multi-season "story mode," where teams and leagues evolve, merge, and vanish over time.

**Every session starts by reading `PROGRESS.md`** (repo root) before anything else. Read it before you write code, before you re-read the MVP specs, and before you ask the user what to do. It tells you what is already done, what the previous session left mid-flight or flagged, and what task comes next. Do not assume a clean slate. Assume a handoff.

---

## Tech Stack

- **Frontend:** Tauri + Preact (with preact-router)
- **Language:** TypeScript
- **Bundler:** Vite
- **Data:** lightweight, file-based format — importable/exportable, no external DB server. JSON for leagues/teams/database exports (each entity carries a permanent UUID for cross-file identity), CSV for quick team-list bulk editing, plain text for read-only result exports.

## Build, Test & Lint Commands

### Pre-session setup
Before starting work on a new session, run:
```bash
npm install        # ensures all deps are current
npm run type-check # catch TS errors before writing tests
npm test           # run the full test suite; should pass before work begins
npm run lint       # check for lint violations (warnings only, no blocker)
```

### During development
While actively working on a task:
```bash
npm test -- --watch              # continuous test mode
npm run lint:fix                 # auto-fix lint + format issues
npm run format                   # format code with Prettier
```

### Before finishing a task
When closing out work on a task, run the full suite:
```bash
npm run lint                     # catch style issues
npm run type-check               # final TypeScript check
npm test                         # full test suite — confirm no regressions
npm run test:coverage            # optional: check coverage, flag gaps
```

### Tauri-specific (desktop app)
```bash
npm run tauri:dev                # launches the app in dev mode with hot reload
npm run tauri:build              # builds for distribution (slow, do once at end)
```

---

## Documentation

General source specs live in [docs](/docs/):
- The four MVPs, in build order
  - [`MVP1`](/docs/scorinator-mvp1.md)
  - [`MVP2`](/docs/scorinator-mvp2.md)
  - [`MVP3`](/docs/scorinator-mvp3.md)
  - [`MVP4`](/docs/scorinator-mvp4.md)
- [`Module boundaries`](/docs/module-boundaries.md) — project structure. Do not restructure without discussion
- [`Design reference`](/docs/design-reference/) — The Claude Design handoff bundle (rendered prototype screens) for each MVP. [See its own readme](/docs/design-reference/README.md) for how these are used, and how they are not
- [`TDD`](/docs/tdd) — Workflow and strategies by layer. Mandatory adherence
- [`Future features`](/docs/scorinator-future-features.md) — explicitly out of scope, do not implement
- [`Coding standards`](/docs/coding-standards.md) — general implementation rules that apply across modules (not module-specific — those live with their module below)

Module-specific documentation lives at the root of that module.
- [`ENGINE`](/src/engine/ENGINE.md) — scorinator engine determinism requirements
- [`PERSISTENCE`](/src/persistence/PERSISTENCE.md) — persistence/storage architecture
- [`DESIGN_SYSTEM`](/src/design-system/DESIGN_SYSTEM.md) — tokens/primitives implementation rules (fonts, units, spacing)
- [`FEATURES`](/src/features/FEATURES.md) — screen folders vs. the shared `features/components/` folder, and the required import direction between them

---

## Implementation scope — MVP1 and MVP2 only, for now

All four MVP docs exist and are written. **Only MVP1 and MVP2 are approved for implementation at this time.** `scorinator-mvp3.md` and `scorinator-mvp4.md` are read-only references for context. They explain *why* certain MVP1/2 things take the shape they do — for example, why Team splits into Blueprint/Instance in MVP2, even though Season does not exist yet. They are not a queue of upcoming tasks.

- Do not implement any MVP3 or MVP4 feature, even partially, even if a task seems to lead there naturally. For example: do not add a `City` field to Team Blueprint — that is MVP3 scope. Do not build Season grouping — also MVP3. Do not build the event system for Story Mode — that is MVP4 scope.
- It is fine, and expected, for MVP1/2 code to take a shape that avoids a breaking rework once MVP3/4 land. For example, the Instance Wrapper design in MVP2 already anticipates Season. Shaping code for extensibility is different from building the extension itself. If you are unsure which side of that line a piece of work falls on, ask rather than proceed.
- This restriction lifts only when explicitly told MVP3 (or MVP4) is approved for implementation. Check `PROGRESS.md` for the current approved scope before starting any task. It states the scope plainly at the top.

---

## Open items to flag, not silently resolve

These are known-unresolved in the specs. If work touches them, stop and propose an explicit approach rather than guessing:
- OVR-difference vs. absolute-OVR weighting in match simulation (MVP1).
- Team event trigger frequency/probability curve shape (MVP4 says "configurable," but the underlying distribution is not specified).
- Autosave during the automatic end-of-season pipeline in Story Mode (explicitly deferred in `scorinator-technical-caveats.md` §5 — do not implement unless separately scoped).
- Anything listed in `scorinator-future-features.md` — out of scope, do not implement even if it looks like a natural extension of a current task.
- MVP3 uses different wording for Instance-scoping than the corrected wording in MVP/technical-caveats. MVP3 says "scoped to one Season." The caveats doc corrects this to "scoped to one Instance Wrapper." Treat the Instance Wrapper version as authoritative, per the caveats doc — the MVP3 doc text has not been updated yet.

---

## Maintaining PROGRESS.md

`PROGRESS.md` is the handoff mechanism between sessions — see that file for its structure. Every session is responsible for:
- Reading it first (per the top of this file).
- Marking a task **in progress** (with a start timestamp) when picked up.
- Marking it **done** (with a completion timestamp) and writing the session report before ending. Do not defer this to "next session" — there may not be context left later to write an accurate one.
- If a task stops partway — blocked, out of scope, or needing a decision from the user — record that honestly. Use an **in-progress / blocked** entry. State what is done, what is not, and what the next session needs to know. Do not leave it silently incomplete, and do not mark it done when it is not.
- If a task surfaces one of the §6 open items, or anything needing a user decision, log it in the open-questions section of `PROGRESS.md`. Do not just mention it in chat — the next session will not see it there.

A session should never end with uncommitted, unrecorded state — code without a matching `PROGRESS.md` entry is effectively invisible to the next session.

---

## When in doubt

Ask for clarification rather than assuming. This applies especially when a task would require:
- Restructuring the module map in §1.
- Picking a numeric value for an open balancing detail in §6.
- Implementing anything beyond the current approved MVP scope (§0).
- Touching the design brief directly, instead of going through `design-system/`.
