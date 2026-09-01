# Scorinator — Technical Caveats (for Claude Code)

Implementation-level decisions that sit underneath MVP 1–4's functional specs. This doc doesn't change any user-facing behavior — it's the "how" for things the MVP docs already committed to at the "what" level.

Scope for this pass: **data persistence & file layout**. Other flagged items (Tauri/Preact state management approach beyond persistence, UUID/provenance implementation, simulation implementation notes, sequential-season scheduling logic) are left as open items below — not covered here.

---

## 1. Problem Statement

Scorinator's data model (per MVP1–3) is a single file-based JSON database, loaded and saved as one unit. This is fine at MVP1–3 scale. Story Mode (MVP4) introduces open-ended growth: a single story can run through many Seasons over time, each with its own City→Regional→National league chain, and — per the Season Timeline / Story dashboard — old seasons' results are kept, not purged. Team *count* alone (even thousands of Blueprints) isn't the concern; accumulated **match/fixture/result history across many seasons** is what can make a monolithic single-file database large and slow to load/save wholesale.

The app is confirmed **single-window** (no concurrent-writer problem to solve), and saves are **explicit, user-triggered actions** (per MVP1's Save/Load), not continuous autosave — this significantly lowers urgency, since disk I/O only happens at deliberate save points, not on every scorinate. That said, whether Story Mode's automatic end-of-season pipeline should also autosave is an **open question** (see §5) that would raise the stakes on write frequency if answered "yes."

## 2. Decision: Decentralize into a Manifest + Per-Wrapper Files, via the Instance Wrapper

Split the single database file along the **Instance Wrapper boundary** (see §2a below), which generalizes the Season boundary to also cover standalone Leagues, rather than requiring every League to sit inside a Season. This still aligns with the existing Blueprint/Instance split (MVP2): Blueprints are global and wrapper-independent; Instances, fixtures, and results are wrapper-scoped.

**File layout:**

| File | Contents | Load behavior |
|---|---|---|
| `manifest.json` | List of Instance Wrappers (UUID, content type — standalone League or Season, time label if a Season, linked league names, team count), full list of global Team Blueprints, Locations (Country/Region/City + adjacency), installation UUID | Always loaded on app start |
| `wrapper-{uuid}.json` | That wrapper's Team Instances, plus its `content` — either one standalone League (Phases, fixtures, results) or a full Season (its linked Leagues, Phases, fixtures, results, queued relegations) | Lazy-loaded into the GSM only when the user opens it; kept **suspended** in memory (not evicted) if it has unsaved changes when the user navigates away — see §2b |

The active wrapper is fully hydrated and writable in the in-memory store; any other opened-but-unsaved wrapper stays suspended in memory rather than evicting, per the suspend-on-navigate-away design (§2b). This keeps steady-state memory and per-save I/O bounded by however many wrappers the user has actually opened, not the whole story's history.

This is also consistent with the Identity/Provenance system already specified (MVP2): UUID-based cross-file references and skip-or-fork import conflict resolution were already designed for multi-file portability (per-League export already works this way). Decentralizing the core database extends an existing pattern rather than introducing a new one.

### 2a. Instance Wrapper design

The Instance Wrapper is the entity that actually owns Team Instances — not Season directly. This is a deliberate structural shift from MVP3's original wording ("a Team Blueprint's live state is scoped to one Season"): Instances now live on the wrapper, with League or Season sitting alongside them as its `content`, rather than nested inside a Season that owns the Instances itself. This is what lets a standalone League have its own scoped Team Instances (and its own suspend/save lifecycle) without needing to be wrapped inside a full Season object just to exist.

```
InstanceWrapper<T>: {
  uuid: string,
  teams: TeamInstance[],
  content: T   // T = League (standalone case) or Season (grouped case)
}
```

**League and Season each keep their own permanent UUID** (per the existing Identity/Provenance system) — the wrapper does **not** centralize or replace their identity. This matters once a Season contains more than one League: Team Instance "league membership(s)" is a list (MVP2), Promotes-to/Relegates-to targets and Cup feeder leagues (MVP3/4) all reference *individual* Leagues by their own UUID — none of that works if every League inside a Season shared one collapsed wrapper-level identity. A Season is a container of several identity-bearing Leagues, not a 1:1 wrapper-to-content relationship the way a standalone League is.

Instead, the **wrapper's own UUID mirrors whichever single thing it contains**:
- Standalone case: wrapper UUID = the League's UUID (1:1, nothing to disambiguate). File: `wrapper-{league-uuid}.json`.
- Season case: wrapper UUID = the Season's UUID (also always 1:1 — a Season only ever sits in one wrapper). File: `wrapper-{season-uuid}.json`.

This keeps every League's own identity fully intact for cross-referencing and per-League export exactly as MVP2–4 already require, while still giving the wrapper one clean, portable identity of its own for GSM/persistence purposes — no redundant third UUID to keep in sync.

**Future extension flagged, not designed:** `T` may later include `Story` (a container of many Seasons over time). Story should **not** flatten Instances up to its own level the same way — MVP3's rule that a Blueprint gets an *independent* Instance per Season must hold even under Story Mode. Expect Story to be a container of several independent Season-wrappers (each keeping its own Instance list), not a single `InstanceWrapper<Story>` with one shared Instance list spanning the whole story. Not designed yet — noted so the pattern isn't stretched further than it supports.

### 2b. Suspend-on-navigate-away (GSM behavior)

- When the user navigates away from an opened wrapper's screen, it is **suspended in memory rather than evicted** if it has unsaved changes — kept exactly as-is, not re-hydrated from disk on return (valid, since this is single-window with no other writer).
- No cap on how many wrappers can be suspended concurrently at this stage — left unbounded for now.
- Saving remains explicit only (File > Save / Ctrl+S) for MVP1 — no autosave. See `scorinator-future-features.md` for autosave and related ideas raised and deferred.
- Closing the app while one or more wrappers are suspended with unsaved changes should prompt the same unsaved-changes dialog.

## 3. Consequences to Design For

- **Cross-file referential integrity.** A League inside a Season-content wrapper references Team Instances (on that same wrapper) that reference Blueprints living in `manifest.json`. The manifest becomes load-bearing — it must stay in sync whenever a wrapper is created, renamed, or its team roster changes. A wrapper file should never be treated as self-sufficient without the manifest.
- **Atomic writes across multiple files.** A crash mid-save must not leave the manifest and a wrapper file disagreeing about what exists. Use temp-file-then-rename per file, manifest as final source of truth, and consider writing the manifest last (so a crash before it commits just means one orphaned/harmless wrapper file, not a manifest pointing at a missing one).
- **"Entire database" export/import** (MVP2 File Module scope: "everything... in one file") needs to become a **bundle** (e.g. a zip or a directory) of manifest + all wrapper files, rather than one flat JSON. This is a real format change to that feature, not just an internal refactor — worth flagging to whoever implements the File Module.
- **Per-League / per-Blueprint export** (already scoped as self-contained JSON snapshots in MVP2) is unaffected — those already embed what they need and don't depend on this file split.
- **MVP3's Instance-scoping language needs a follow-up correction.** "Scoped to one Season" should be revised to "scoped to one Instance Wrapper" wherever it appears, now that standalone Leagues also scope Instances without a Season present. Not applied to the MVP docs yet — flagged here for whoever does that pass.

## 4. What This Doesn't Change

- The Blueprint/Instance/Season conceptual model — unchanged, this is purely a storage-layer decision underneath it.
- GSM choice (Zustand or equivalent single in-memory repository, hydrated from disk, write-through on mutation) — unaffected; it now hydrates from multiple wrapper files instead of one, and supports partial hydration (only opened wrappers).
- Rejection of TanStack Query as the primary data layer — still holds. This is a local, single-writer, explicit-save file store, not a remote cache-freshness problem.

## 5. Open Items

- **Autosave** (both during Story Mode's automatic end-of-season pipeline, and on navigating away from a wrapper's screen) — explicitly deferred; manual save (File > Save / Ctrl+S) plus suspend-in-memory is the committed MVP1 behavior instead. See `scorinator-future-features.md`.
- **Eviction policy for suspended wrappers in the GSM** — largely resolved: a wrapper suspends (stays hydrated, does not re-hydrate from disk on return) if it has unsaved changes; no cap on how many can be suspended concurrently at this stage. Left unbounded deliberately for now — worth revisiting if memory footprint becomes a real concern at scale (many suspended wrappers left open across a long session).
- **Freshness/re-hydration check for suspended wrappers** — currently assumed unnecessary, since this is single-window with no other writer, so disk can't change out from under a suspended wrapper. Flagged as a concern to revisit if that assumption ever changes (e.g. multi-window support).
- **Threshold at which even a single wrapper's file gets large enough to matter** (e.g. very long-running Story Mode within one Season, many Team Events/mergers). No current data to size this against — worth revisiting once a real playthrough's file sizes are observable.
