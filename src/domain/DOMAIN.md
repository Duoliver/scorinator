# DOMAIN: the record types of the app

`src/domain/` holds the shapes of the app's own records: what a team and a league are in memory. Both `app/` and `features/` use them, so they cannot live in either one. Before Task 53 they lived in `features/`, and `app/state` imported from `features/`.

## Rules

- **Types only, for now.** A function on these records stays out of `domain/` until the user agrees. See Task 54 in `PROGRESS.md`.
- **Imports:** `domain/` imports only `engine/` types. It never imports `app/`, `features/`, `adapters/`, `persistence/`, `design-system/`, Preact, or Tauri.
- **Who imports it:** `app/` and `features/`.
- **`engine/` never imports it.** The engine stays generic over its `TeamId`.
- **`adapters/` never imports it.** A file format keeps its own types (`SavedLeague`, `TeamCsvRecord`). `app/data` maps between the two.
- **Import from the barrel:** `import type { LeagueRecord } from '@/domain'`.

## Where this goes next

MVP2 splits a team into a Blueprint and an Instance, and adds the Instance Wrapper (`PERSISTENCE.md` §2a). Those types belong here.
