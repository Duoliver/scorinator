# Task 13 — decisions log: League Setup screen

Judgment calls made while building the League Setup screen, plus its two direct follow-ups (the `Tabs` ref API, Select all), that a later session should not re-litigate. Condensed here from the running Decisions log in `PROGRESS.md` — see that section for the procedure this follows, and `progress-reports/013-league-setup-screen.md` for the overall report on this task and its addenda.

- **2026-09-10 (screen build):** Six calls, confirmed with the user before and during the build:
  1. **Team picker:** built to the flat MVP1 `TeamRecord` model (inline checklist), not the MVP2 Blueprint/Instance dialog picker. No Blueprint/Instance split exists anywhere yet — `SavedTeam` (Task 9) and `TeamRecord` (Task 12) are both flat, and that split would be a multi-task rework, not a Task-13-sized change.
  2. **Module boundary:** added the `app/state/` layer `module-boundaries.md` calls for, instead of repeating the direct `adapters/` imports already in `features/teams`. `features/teams` itself keeps that pre-existing deviation, unfixed, since fixing it was out of scope here.
  3. **Screen layout:** built as a 3-step wizard (Details, Teams, Review), matching the design-reference prototype, not a single-page form.
  4. **Season boundary:** MVP1 has no Season entity, but the user confirmed the league itself stands in for one for now. OVR now rolls at league creation, in `useLeagueStore().addLeague()`, using `rollOVR` (`engine/tier-ovr`) and a fresh `createSeededRng` seed. This matches the seeding style already used in the scorinator playground in `App.tsx`.
  5. **Shared components:** `TeamForm` (and the `TeamRecord` type it needs) moved from `features/teams/` into a new `features/components/` folder, to avoid a cycle between `features/teams` and `features/leagues`. New rule, documented in `src/features/FEATURES.md` and cross-linked from `module-boundaries.md`: `features/components/` never imports from a screen folder, only the reverse.
  6. **State manager:** Zustand, matching what `PERSISTENCE.md` already anticipated. `@preact/preset-vite` already aliases `react`/`react-dom` to `preact/compat`, so no extra Preact wiring was needed for the library itself.

  One build-time gotcha, not a design call: Vitest externalizes `node_modules` packages by default. This bypasses the alias resolution Vite normally applies to them. The react-hook binding in Zustand then failed to resolve the bare `react` import under test (`Cannot find package 'react'`), even though the alias works fine in `vite build`, and would in `tauri dev` too. Fixed by adding `test.server.deps.inline: ["zustand"]` to `vitest.config.ts`. This forces Zustand through the transform pipeline of Vite in tests too.

  Also split the `preact-router`/nav-shell part of Task 22 into a new Task 23, at the request of the user. Task 23 runs right after this task, instead of waiting for every MVP1 screen to exist. See the Task 22 and Task 23 rows in the status board of `PROGRESS.md`.

- **2026-09-10 (`Tabs` gains an imperative ref API):** The user asked for a way to switch the active tab from outside `Tabs`, without lifting the active-tab state into the parent. They then asked for the wizard in `LeagueSetupScreen` to use it.

  `Tabs` now forwards a ref shaped as `FieldHandle<string>`. This is the same ref shape `Input`/`Select`/`Switch`/`Checkbox` already expose for their own value, reused here rather than inventing a new handle type. `getValue`/`setValue`/`subscribe` read and drive the active tab id. `focus` moves focus to the active tab button. `setValue` does not call `onChange` — this matches how the other fields already treat a programmatic `setValue` as distinct from a user click.

  `LeagueSetupScreen` dropped its own `step` state and hand-rolled stepper buttons. It now renders one `Tabs`, with each wizard step as a `TabItem`. Each step has its own Back/Next button, and each calls `stepsRef.current?.setValue(id)`.

- **2026-09-10 (Select all in the Teams step):** The user asked for a "select all" control in the Teams step of League Setup.

  `TeamsStep` gained a button next to the "N teams selected" line, labelled "Select all" or "Clear selection" depending on whether every currently visible team is already selected. It acts on the teams the search box currently shows, not the full roster. This matches how "select all" behaves in most apps with a filter box.

  One real bug avoided along the way: each `Checkbox` in a row is uncontrolled (`defaultChecked`, read once on mount, the same pattern `Input`/`Select`/`Switch` use). A bulk select or clear that only updated `selectedSlugs` in the parent would change the "N teams selected" count, without the boxes themselves visually checking or unchecking. This is the same class of staleness bug the Task-12 edit-drawer fix addressed earlier.

  `TeamsStep` now keeps a `Map` of the `FieldHandle<boolean>` for each visible row, taken from the ref `Checkbox` exposes. It calls `.setValue()` on every affected row when "Select all" or "Clear selection" runs, alongside the callback that updates the real selection state one level up.
