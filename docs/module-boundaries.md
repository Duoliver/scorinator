# Module boundaries (fixed — do not restructure without discussion)

The module map below is a direct transcription of decisions already made in the specs (mainly `scorinator-technical-caveats.md`), not a new design. Treat it as settled:

```
/src
  /engine            pure TypeScript domain logic. Zero imports from Preact,
                      Tauri, or the filesystem. Framework-agnostic and
                      testable with plain vitest, no DOM.
    /tier-ovr
    /fixtures           (round-robin generation, byes, single-duels balancing)
    /scorination        (match simulation — see §3 on RNG injection)
    /standings
    /bracket            (seeding, byes, re-scorination cascade)
    /tiebreak           (AET / penalties / replay / coin-toss)
    /locations
    /story-mode         (season pipeline, team events, mergers)
    /identity           (UUID generation, skip/fork conflict resolution)

  /persistence        interfaces only — no direct fs/Tauri calls here either.
                       Defines what an adapter must implement (manifest
                       read/write, wrapper read/write, atomic write contract).

  /adapters
    /tauri-fs           real filesystem adapter, implements /persistence
    /csv                team CSV import/export
    /json-io            manifest + wrapper JSON serialization

  /design-system       tokens (CSS variables) + primitives (Button, Card,
                       Badge, Table, Tabs, Input, etc.) extracted from the
                       Claude Design handoff bundle.

  /features            screens, composed from /engine + /design-system.
                       Never imports /persistence or /adapters directly —
                       goes through a thin app-level data layer instead.

  /app                 Tauri bootstrap, routing, wiring of adapters to features
```

**Crossing rules (enforced, not suggestions):**
- `engine/` never imports from `features/`, `design-system/`, `adapters/`, or Preact/Tauri. If a task seems to require this, stop and flag it — it likely means domain logic leaked into the wrong layer.
- `features/` never talks to `adapters/` directly. It calls `engine/` functions and a thin data-access layer that itself depends on `persistence/`'s interfaces.
- `persistence/` defines contracts; `adapters/` implements them. Engine code never imports `adapters/`.
- `design-system/` is the only layer allowed to reference the design brief. `features/` consumes `design-system/`, never the brief itself. See §4.

**What this map is not:** a license to pre-design the internals of each module (function signatures, class shapes, event schemas) before tests exist. Boundaries are fixed; internals are designed just-in-time per §2. Do not create empty scaffolding for modules you aren't actively building.