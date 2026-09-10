# Task 13 — League Setup screen

**What was built:** `features/leagues` holds `LeagueSetupScreen`, a 3-step wizard (Details, Teams, Review). Details takes a league name, win/draw/loss points (defaulting from `DEFAULT_POINTS_CONFIG` in `engine/standings`), and a home-advantage switch. Teams lists the shared team roster with a search box and a checkbox picker, plus a "+ Create new team" drawer that reuses `TeamForm`. Review shows a read-only summary and a "Create league" action. `App.tsx` mounts `LeagueSetupScreen` under `TeamsScreen`, the same ad hoc way as before.

Two new supporting pieces went in alongside the screen:
- `features/components/` — a new folder holding `TeamForm` (moved out of `features/teams/`) and the `TeamRecord` type it needs. `features/leagues` and `features/teams` both import from here now, instead of `features/leagues` importing `features/teams` directly. `src/features/FEATURES.md` documents the rule: `features/components/` never imports from a screen folder, only the reverse.
- `app/state/` — two Zustand stores. `useTeamsStore` holds the one shared, in-memory team roster. `useLeagueStore` holds the created-league list. `TeamsScreen` now reads and writes through `useTeamsStore`, instead of its own local state. This means a team created on either screen shows up on both, in the same session. `useLeagueStore().addLeague()` rolls the OVR for each selected team once, at league creation, using `rollOVR` (`engine/tier-ovr`) and a freshly seeded `Rng`.

**Test approach:** This task used Testing Library integration tests, per the `features/` row of `tdd.md`. It added one test file per step component, plus a full-wizard `LeagueSetupScreen.test.tsx`. Both match the style of `TeamsScreen.test.tsx`. `app/state/teamsStore.ts` and `leagueStore.ts` got plain unit tests against the store directly, using `getState()`/`setState()`. One of those checks that a rolled OVR always lands inside the Tier range for its team. `TeamsScreen.test.tsx` gained a `beforeEach` that resets `useTeamsStore`, since the store is now a module-level singleton shared across tests. 252 tests pass repo-wide. `type-check` and `lint` both come back clean.

**Decisions made:** Six calls, confirmed with the user before and during the build. Full detail lives in the 2026-09-10 entry of the decisions log in `PROGRESS.md`:
1. Team picker stays MVP1-flat (a `TeamRecord` checklist), not the MVP2 Blueprint/Instance dialog picker. That split does not exist anywhere in the codebase yet.
2. Added the `app/state/` layer `module-boundaries.md` calls for, rather than repeating the direct `adapters/` imports already in `features/teams`. That deviation in `features/teams` stays unfixed — out of scope here.
3. Built the 3-step wizard from the design-reference prototype, not a single-page form.
4. MVP1 has no Season entity, so the league itself stands in for one. OVR rolls at league creation now, not deferred to fixture generation.
5. `TeamForm` and `TeamRecord` moved into a new `features/components/` folder, to avoid a cycle between `features/teams` and `features/leagues`. Rule and reasoning live in `src/features/FEATURES.md`.
6. Zustand, matching what `PERSISTENCE.md` already anticipated.

One build-time-only finding, not a design call: Vitest externalizes `node_modules` packages by default. This skips the alias resolution Vite normally applies to them. As a result, the react-hook binding in Zustand failed to resolve the bare `react` import under test. `vite build` and the `preact/compat` alias both work fine outside tests. Fixed with `test.server.deps.inline: ["zustand"]` in `vitest.config.ts`.

This session also split the `preact-router`/nav-shell part of Task 22 into a new Task 23, at the request of the user. Task 23 runs right after this task, instead of last.

**What is left, what is next:** No fixture generation (Task 14), no file save or export of a created league (Task 17), and no MVP2 Instance-based team picker. All three are explicitly deferred, not silently dropped. `App.tsx` still mounts both screens ad hoc, with no real navigation between them. Task 23 (new) replaces that next. The Tauri click-through path remains unverified in this sandbox, the same open item Task 21 and Task 12 already flagged — this sandbox has no display.
