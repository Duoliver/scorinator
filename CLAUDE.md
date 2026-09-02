# CLAUDE.md — Scorinator Overview and Implementation Guide

**Scorinator** is a desktop app for building and simulating fictional football (soccer) league ecosystems — from a single round-robin among a handful of teams up to a full national pyramid with cups, promotion/relegation, and a multi-season "story mode" where teams and leagues evolve, merge, and vanish over time.

**Every session starts by reading `PROGRESS.md`** (repo root) before doing anything else — before writing code, before re-reading the MVP specs, before asking the user what to do. It tells you what's already done, what the previous session left mid-flight or flagged, and what task is next. Do not assume a clean slate; assume a handoff.

---

## Tech Stack

- **Frontend:** Tauri + Preact (with preact-router) + Tailwind
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
- [`Design reference`](/docs/design-reference/) — The Claude Design handoff bundle (rendered prototype screens) for each MVP — [see its own readme](/docs/design-reference/README.md) on how these are and aren't used
- [`TDD`](/docs/tdd) — Workflow and strategies by layer. Mandatory adherence
- [`Future features`](/docs/scorinator-future-features.md) — explicitly out of scope, do not implement

Module-specific documentation lives in that module's root.
- [`ENGINE`](/src/engine/ENGINE.md) — scorinator engine determinism requirements
- [`PERSISTENCE`](/src/persistence/PERSISTENCE.md) — persistence/storage architecture
The **`design-system/`** module does not have a dedicated spec doc as of yet. Please, refer to the general `Design reference` doc and raise questions when needed. No silent solving.

---

## Implementation scope — MVP1 and MVP2 only, for now

All four MVP docs exist and are written, but **only MVP1 and MVP2 are approved for implementation at this time.** `scorinator-mvp3.md` and `scorinator-mvp4.md` are read-only references for context (they explain *why* certain MVP1/2 things are shaped the way they are, e.g. why Team is split into Blueprint/Instance in MVP2 even though Season doesn't exist yet) — they are not a queue of upcoming tasks.

- Do not implement any MVP3 or MVP4 feature, even partially, even if a task seems to naturally lead there (e.g. do not add a `City` field to Team Blueprint — that's MVP3; do not build Season grouping — MVP3; do not build Story Mode's event system — MVP4).
- It is fine, and expected, for MVP1/2 code to be shaped so it *won't* need a breaking rework when MVP3/4 land (e.g. MVP2's Instance Wrapper design already anticipates Season) — but shaping for extensibility is different from building the extension. If unsure which side of that line a piece of work falls on, ask rather than proceed.
- This restriction lifts only when explicitly told MVP3 (or MVP4) is approved for implementation. Check `PROGRESS.md` for the current approved scope before starting any task — it will state it plainly at the top.

---

## Open items to flag, not silently resolve

These are known-unresolved in the specs. If work touches them, stop and propose an explicit approach rather than guessing:
- OVR-difference vs. absolute-OVR weighting in match simulation (MVP1).
- Team event trigger frequency/probability curve shape (MVP4 says "configurable," but the underlying distribution isn't specified).
- Autosave during Story Mode's automatic end-of-season pipeline (explicitly deferred in `scorinator-technical-caveats.md` §5 — do not implement unless separately scoped).
- Anything listed in `scorinator-future-features.md` — out of scope, do not implement even if it looks like a natural extension of a current task.
- MVP3's Instance-scoping wording ("scoped to one Season") vs. MVP/technical-caveats' corrected wording ("scoped to one Instance Wrapper") — treat the Instance Wrapper version as authoritative per the caveats doc; the MVP3 doc text itself hasn't been updated yet.

---

## Maintaining PROGRESS.md

`PROGRESS.md` is the handoff mechanism between sessions — see that file for its structure. Every session is responsible for:
- Reading it first (per the top of this file).
- Marking a task **in progress** (with a start timestamp) when picked up.
- Marking it **done** (with a completion timestamp) and writing the session report before ending — not deferring this to "next session," since there may not be context left to write an accurate one later.
- If a task is stopped partway (blocked, ran out of scope, needs a decision from the user), recording that honestly as an **in-progress / blocked** entry with what's done, what isn't, and what the next session needs to know — rather than leaving it silently incomplete or marking it done when it isn't.
- If a task surfaces one of the §6 open items or anything needing a user decision, logging it in `PROGRESS.md`'s open-questions section, not just mentioning it in chat where the next session won't see it.

A session should never end with uncommitted, unrecorded state — code without a matching `PROGRESS.md` entry is effectively invisible to the next session.

---

## When in doubt

Ask for clarification rather than assuming — especially when a task would require: restructuring the module map in §1, picking a numeric value for an open balancing detail in §6, implementing anything beyond the current approved MVP scope (§0), or touching the design brief directly instead of going through `design-system/`.
