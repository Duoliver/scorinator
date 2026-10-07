# Task 49 — Codebase audit against the refactor rules

**What was built:** An audit of every source file in `src/`, against `docs/coding-standards.md`, `src/features/FEATURES.md`, `docs/module-boundaries.md`, `docs/tdd.md`, `docs/code-review-checklist.md`, and the module docs. No code changed. Each gap below is a new task row, Tasks 50 to 71, in `PROGRESS.md`.

**Method:** grep checks for the mechanical rules (relative `../` imports, deprecated `JSX.*` members, `!important`, `style` props, `px` and literal sizes in CSS, `Math.random` in `engine/`, import directions between modules), `prettier --check src`, then a read of each non-test file in `app/`, `features/`, `design-system/`, `engine/`, `adapters/`, and `persistence/`.

**Baseline at the start:** `type-check` clean, 600 tests pass in 58 files, `lint` clean.

## Clean, no task needed

- No `../` import. No `!important`. No deprecated `JSX.*` member (`JSX.Element` is not deprecated).
- `engine/` imports nothing outside `engine/`. Every random decision in `engine/` takes an injected `Rng`.
- `features/components/` imports no screen folder.
- `adapters/tauri-fs` tests use a real temp directory, as `tdd.md` asks.
- `StandingsView`, `FixturesView`, `LeagueSetupScreen`, `FileScreen`, and `StatusLine` follow the three-layer rule.
- `ReviewStep`, `FileCard`, `SetupChips`, `LeagueList`, and `TeamFormDrawer` have no state or effects, so they need no hook.

## Gaps, by group

### Safety net and hygiene (do first)

| Task | Gap | Evidence |
|------|-----|----------|
| 50 | No app-level smoke test. `tdd.md` asks for one for the load-bearing flow: create team, create league, generate fixtures, scorinate, save, load. The refactor tasks below move code across modules, so this test protects them. | No test file mentions the flow. The `round-trip` tests cover serialization only. |
| 51 | 14 files fail `prettier --check src`. `npm run lint` does not check the format, so nothing catches it. | `app/data/leagueFile.ts`, `engine/fixtures/roundRobin.ts`, `engine/standings/standings.ts`, `persistence/types.ts`, `design-system/components/Button/types.ts`, 1 `.md` file, and 8 test files. |
| 52 | 13 comments in 11 files name code that Tasks 41 to 46 moved or renamed. | `LeagueSetupScreen.handleCreate` (now in `useLeagueSetup`): `leagueName.ts:11`, `DetailsStep.tsx:83`, `ReviewStep.tsx:52`, `leagueActions.ts:65`, `LeaguesDashboardScreen.tsx:14`. `App.tsx`'s playground: `leagueActions.ts:14`. `leagueStore`'s `addLeague`: `features/leagues/types.ts:26`. `shown by AppShell` (now `StatusLine`): `fileStore.ts:16`. `features/teams` or `features/file` calls these (now the app actions): `teamsCsv.ts:11`, `leagueFile.ts:15`, `resultsTxt.ts:13`. `writes results back here` (no `app/data` file writes a store): `teamsStore.ts:9`. |

### Module boundaries and domain logic

| Task | Gap | Evidence |
|------|-----|----------|
| 53 | **Needs a decision.** The domain types live in `features/`, so `app/` depends on `features/`. `LeagueRecord`, `LeagueTeam`, `LeagueResult`, and `CreateLeagueInput` are in `features/leagues/types.ts`. `TeamRecord` is in `features/components/types.ts`. Also, `features/leagues` imports `fixtures` and `standings`, and those two import `features/leagues/types`: two screen folders import each other. | 12 `app/` files import these types. `leagueStore.ts:4` has a comment about a cycle it avoids. |
| 54 | One match is found by `(matchday, home, away)` in 5 places, with 5 implementations. `features/scorination/` is not a screen: it holds only pure lookups. Report 041 also says `playFixture` is domain logic. | `isResultOf` (`leagueActions.ts`), `findResult` (`features/scorination/resultLookup.ts`), the fixture check in `savedToLeague` (`app/data/leagueFile.ts`), `fixtureKey` and `MatchIdentity` (`features/fixtures`), `matchKey` (`adapters/txt/resultsTxt.ts`). |
| 55 | `isTier` is written 3 times. The JSON team parser returns a type named `TeamCsvRecord`, and imports it from `adapters/csv/types`. Some adapters import past the `engine/` barrels. | `isTier` in `adapters/csv/teams.ts`, `adapters/json-io/teams.ts`, `adapters/json-io/league.ts`. `@/engine/tier-ovr/types`, `@/engine/standings/types`, `@/engine/fixtures/types` imports in `adapters/`. |
| 56 | The adapter type `TeamCsvRecord` goes up to the app actions. The callers write the same wrapper 4 times. | `app/data/teamsCsv.ts`, `teamsJson.ts`, `teamsFile.ts` return `TeamCsvRecord[]`. `loadActions.ts:1` imports `@/adapters/csv`. `importTeams(() => importTeamsX())` in `TeamsScreen`, `LeaguesEmptyState`, and `useFileManager` (2 times). `teamRecordToCsvRecord` only copies the object. |
| 57 | The same small code repeats across the app actions. | `leagues.find((candidate) => candidate.slug === slug)` 5 times. `(error as Error).message` 9 times. This cast gives `undefined` when the code throws a value that is not an `Error`. |

### Shared UI code

| Task | Gap | Evidence |
|------|-----|----------|
| 58 | The team colour swatch markup repeats in 5 files, with 5 CSS rules. Some add a `transparent` fallback and some do not. | `TeamsScreen.tsx:45`, `TeamsStep.tsx:83`, `ReviewStep.tsx:38`, `FixturesView.tsx:134` and `:148`, `standings/helpers.tsx:26`. |
| 59 | The league summary text repeats. | `${win}/${draw}/${loss} pts` in `LeagueDetailScreen`, `LeagueList`, and `SetupChips/helpers.ts`. `Round robin (two-way)` in `ReviewStep` and `leagueSummary.ts`. `Untitled league` in `TeamsStep` and `ReviewStep`. |

### Three-layer rule

| Task | Component | Gap |
|------|-----------|-----|
| 48 (open) | `TeamForm` | Module-scope constants in the component file. |
| 60 | `TeamForm` | No hook. The refs, the error state, the slug preview, and the save handler are in the component. Can merge with Task 48. |
| 61 | `TeamsScreen` | No `types.ts`, no hook, no helpers. The columns, the drawer state, and the rows are in the component. |
| 62 | `LeagueDetailScreen` | No `types.ts` (props interface inline), no hook. Store reads, the league lookup, the `setCurrentLeague` effect, the matchday state, and the meta text are in the component. |
| 63 | `LeaguesDashboardScreen`, `LeaguesEmptyState` | No `types.ts`. The load handler and the plural text are in the components. |
| 64 | `TeamsStep` | No hook. A store read, an `addTeam` call, the search state, the drawer state, the checkbox handles, and the columns are in the component. |
| 65 | `DetailsStep` | No hook. Five refs, the name state, and the imperative handle are in the component. |
| 66 | `AppShell` | Not under the `features/` rule, but the same problem: Ctrl+S listener, close guard, route adapters, nav list, `isNavItemActive`, and the router `onChange` in one 162-line file. `App.tsx` and `main.tsx` import `./app/...` and `./design-system/...`, which are not siblings. |

### Design system and CSS

| Task | Gap | Evidence |
|------|-----|----------|
| 67 | `Input`, `Select`, `Checkbox`, `Switch`, `SwatchPicker`, and `Tabs` each repeat about 25 lines of `FieldHandle` code: the value ref, the listener set, the `onChange` ref, `commitValue`, and `useImperativeHandle`. `FieldHandle` is not in the `design-system` barrel. | 14 non-test files import `@/design-system/field`. |
| 68 | CSS sizes off the token scale. `DESIGN_SYSTEM.md` asks for `--space-*` and `--font-size-*` tokens and `rem`. | `gap: 1.375rem` in `TeamForm`, `Drawer`, `DetailsStep`, `TeamsStep`, `ReviewStep`. `gap: 1.75rem` in `TeamsScreen`. `font-size: 1rem` in `Drawer`. `font-size: 1.25rem` and `padding: ... 1.75rem` in `AppShell`. `width: 420px` in `Drawer`. `220px` two times in `AppShell`. `minmax(300px, 1fr)` in `LeagueList`. The visually hidden block repeats two times in `FixturesView.module.css`. A token snap changes some sizes on screen. |
| 69 | **Needs a decision.** `PlaygroundScreen` breaks four rules. It imports `@/adapters/tauri-fs` (`features/` must not). It has `style={{ width: '100%' }}` (line 291). It holds 5 components in one 319-line file. Its CSS has 6 literal sizes. Keep it and fix it, cut it down, or delete it. | `features/playground/PlaygroundScreen.tsx`, `PlaygroundScreen.module.css`. |
| 70 | `Table` gives `role="row"` with no `role="table"` parent, and its header cells have no `columnheader` role. Screen readers do not read it as a table. | `design-system/components/Table/Table.tsx`. |

### Engine

| Task | Gap | Evidence |
|------|-----|----------|
| 71 | Small repeats in `engine/`. | The win, draw, and loss points code is written two times in `standings.ts` (`applyResult`, `computeMiniLeague`). The `slug()` error says "team name", but leagues use it too. |

## Questions for the user

Both are also in the Open questions section of `PROGRESS.md`.

1. **Task 53:** where do the domain types go? Options: a new top-level `src/domain/` (a change to the module map), `engine/` (the engine then holds app record types), or `app/state/types.ts` (features then import types from `app/`). Tasks 54, 56, and 57 depend on the answer.
2. **Task 69:** keep the Playground and bring it to the rules, cut it down, or delete it?

## Suggested order

50, 51, 52 first: they are small and protect the rest. Then 53 (after the decision), 54, 55, 56, 57. Then 58 and 59, since the three-layer tasks 60 to 66 use them. Then 67, 68, 69, 70, 71 in any order.

**Test approach:** No code changed, so no test changed. The checks above are repeatable with grep and `npx prettier --check src`.

**What is left, what is next:** Each gap is a task row. None is started. A token snap in Task 68 changes sizes on screen, so agree the new sizes with the user before Task 68 starts.
