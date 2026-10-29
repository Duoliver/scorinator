# DOMAIN: the record types of the app

`src/domain/` holds the shapes of the app's own records: what a team and a league are in memory. Both `app/` and `features/` use them, so they cannot live in either one. Before Task 53 they lived in `features/`, and `app/state` imported from `features/`.

## Rules

- **Types only, for now.** A function on these records stays out of `domain/` until the user agrees. See Task 54 in the MVP1 log, `docs/archive/mvp1/PROGRESS.md`.
- **Imports:** `domain/` imports only `engine/` types. It never imports `app/`, `features/`, `adapters/`, `persistence/`, `design-system/`, Preact, or Tauri.
- **Who imports it:** `app/` and `features/`.
- **`engine/` never imports it.** The engine stays generic over its `TeamId`.
- **`adapters/` never imports it.** A file format keeps its own types (`SavedWrapper`, `TeamListRecord`). `app/data` maps between the two.
- **Import from the barrel:** `import type { LeagueWrapper } from '@/domain'`.

## The MVP2 types

Task 104 added the MVP2 record types (2026-10-29):

| File | Types |
|---|---|
| `provenance.ts` | `Provenance`: the two installation UUIDs on an exported entity (US-11.1) |
| `team.ts` | `TeamBlueprint`, the reusable team. `TeamInstance`, its state in one league, with no UUID of its own (US-09.2). `TeamFields`, the four fields of the team form and the team list files (Task 162) |
| `league.ts` | `League`, `Phase` (a union on `format`), `RoundRobinPhase`, `PhaseResult` (with a `fixtureId`, Task 77), `PhaseFormat` |
| `wrapper.ts` | `InstanceWrapper<T>`, `LeagueWrapper`, `Manifest`, `WrapperSummary`, `LeagueProgress` (`PERSISTENCE.md` §2a, Task 76) |

Fixtures, byes, and results name a team by its Blueprint UUID. Each later task adds its own fields: for example, Task 126 adds the groups phase to `Phase`.

**The MVP1 types are gone.** Task 162 removed `TeamRecord`, `LeagueRecord`, `LeagueTeam`, `LeagueResult`, and the MVP1 `CreateLeagueInput` (2026-10-29). The v2 create input is `CreateLeagueInput` in `app/state/leagueWrapperActions.ts`.
