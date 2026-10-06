# Task 47 — `features/leagues` folder layout

**What was built:** Each component in `features/leagues/` now has its own folder. No behaviour changed.

| Before                                          | After                                                                                                                   |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `LeagueDetailScreen.*` at the root              | `LeagueDetailScreen/`, with `index.ts`                                                                                  |
| `LeaguesDashboardScreen.*` at the root          | `LeaguesDashboardScreen/`, with `index.ts`                                                                              |
| `LeagueList/`, `LeaguesEmptyState/` at the root | Inside `LeaguesDashboardScreen/`, the only screen that uses them                                                        |
| `steps/` with four components flat              | `LeagueSetupScreen/steps/DetailsStep/`, `TeamsStep/`, `ReviewStep/`, `SetupChips/`, each with `types.ts` and `index.ts` |
| `steps/leagueName.ts`                           | `LeagueSetupScreen/leagueName.ts`, since `useLeagueSetup` and `DetailsStep` share it                                    |

`types.ts` and `leagueSummary.ts` stay at the `leagues/` root, because several components share them.

**Other changes:**

- Each step's props interface moved to its own `types.ts`, as the default export. `DetailsStepHandle` moved with `DetailsStepProps`.
- `parsePoints` moved to `DetailsStep/helpers.ts`, and `settingsChipLabels` moved to `SetupChips/helpers.ts`. The `SetupChips` barrel still exports `settingsChipLabels`.
- `LeagueList` imported `'../leagueSummary'`, a `../` import that `docs/coding-standards.md` forbids. It now uses `@/features/leagues/leagueSummary`.
- A comment in `design-system/components/Drawer/Drawer.tsx` pointed to the old `steps/TeamsStep` path.

**Decisions made:** The new rule in `src/features/FEATURES.md`: a screen folder with more than one component gives each component a subfolder. A component that only one other component uses goes inside that component's folder. A file that several components share stays at the folder root.

**Test approach:** a move with no behaviour change. All tests moved with their components and pass with no change. 600 tests pass.

**What is left, what is next:** The steps follow the `types.ts` and `helpers.ts` layout, but not the hook layer of the three-layer rule. `TeamsStep` (154 lines, with state and a drawer) and `DetailsStep` (111 lines, with an imperative handle) are candidates for their own hook split. `LeagueDetailScreen` and `LeaguesDashboardScreen` have no `types.ts` yet.
