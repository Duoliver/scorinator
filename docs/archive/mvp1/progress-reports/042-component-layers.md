# Task 42 — Three-layer component rule

**What was built:** A new rule in `docs/coding-standards.md`: a `features/` component has three layers. Module scope holds anything that does not use props or state. A sibling `useX.ts` hook holds store reads, derived data, effects, refs, and handlers. The component calls the hook and returns JSX. The rule also says when to use `useMemo` and `useCallback`.

**Applied to:**

- `features/components/useTeamLookup.ts` (new): looks up a roster team by slug through a `Map`. It gives the slug and no colour for a team not in the roster. The function stays the same object until the roster changes. Exported from the `features/components` barrel.
- `features/standings/useStandings.ts` (new): the rows from `calculateStandings`, with `teamName` and `teamColour` joined in, plus `hasTeams` and `hasResults`.
- `features/standings/StandingsView.tsx`: the 10 columns are now one static `COLUMNS` constant at module scope, with `mono` and `rowKey`. The component body calls `useStandings` and renders.
- `features/fixtures/FixturesView.tsx`: its `teamDisplay` copy and `TeamDisplay` interface are gone. It calls `useTeamLookup()`. Its larger hook split is Task 43.

**Performance finding (the question behind the task):** No real cost today. The functions and objects that a render makes again cost microseconds. No component uses `memo()`, so `useCallback` would save nothing. `calculateStandings` was already in `useMemo`. The one real cost was `teams.find` for each row, and the `Map` in `useTeamLookup` removes it. The widest re-render is `AppShell`: each status set or clear renders the whole active screen again. That is Task 46.

**One behaviour change:** the `useStandings` memo now also depends on the roster. Before, the rows were computed again only on a league change, and the team names were looked up on each render. The output is the same.

**Test approach:** 4 new `renderHook` tests for `useTeamLookup`: a found team, a missing team, the same function on a re-render, and a new function after a roster change. `useStandings` has no own test. The `StandingsView` integration tests cover it, as `docs/tdd.md` asks for `features/`. 589 tests pass.

**Docs:** `docs/coding-standards.md` (the rule), `src/features/FEATURES.md` (a shared hook lives in `features/components/`).

**What is left, what is next:** Tasks 43 to 45 apply the rule to `FixturesView`, `LeagueSetupScreen`, and `FileScreen`. Task 46 is the `StatusLine` change. Other screens (`TeamsScreen`, `LeagueDetailScreen`, `TeamsStep`, `DetailsStep`, `TeamForm`) are small. They can follow the rule when a task touches them.

## Review change (2026-10-06)

The user asked to move the module-scope code out of the component file, the same way the props types live in `types.ts`, and said the `types.ts` rule applies to views too. The user chose one fixed file name, `helpers.tsx` (`helpers.ts` with no JSX), over a split into `constants.tsx` and `helpers.tsx`, or a name for each file's content.

- `features/standings/types.ts` (new): `StandingsViewProps` as the default export, plus `StandingsViewRow` and `Standings`, which moved from `useStandings.ts`.
- `features/standings/helpers.tsx` (new): `COLUMNS`, `mono`, and `rowKey`, which moved from `StandingsView.tsx`.
- `StandingsView.tsx` now holds only the component.
- `TeamDisplay` moved from `useTeamLookup.ts` to `features/components/types.ts`.
- `docs/coding-standards.md`: the `types.ts` rule now covers `features/` views and screens. The three-layer rule now names `helpers.tsx` as layer 1.

The other `features/` views do not follow the `types.ts` and `helpers.tsx` layout yet. Tasks 43 to 45 bring three of them in line. The rest follow when a task touches them.
