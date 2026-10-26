# Task 44 — `LeagueSetupScreen`: three-layer split

**What was built:** `LeagueSetupScreen` now follows the three-layer rule from Task 42. No behaviour changed.

| File                    | Holds                                                                                                                                      |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `LeagueSetupScreen.tsx` | The markup only, 79 lines (222 before): the three step tabs and the status line                                                            |
| `types.ts`              | `TeamSelection`, `LeagueSetup`. The screen has no props, so there is no default export.                                                    |
| `useLeagueSetup.ts`     | The main hook: the store reads, the draft read on mount, the step changes, the focus move, and the create                                  |
| `useLeagueDraftSync.ts` | The unmount write to `leagueDraftStore`, with `latestRef`. It returns `skipDraftSync`, which replaces the old `suppressDraftSyncRef` flag. |
| `useTeamSelection.ts`   | The selected slugs and the four ways to change them                                                                                        |
| `index.ts`              | The folder barrel                                                                                                                          |

**Decisions made:**

- **The screen moved into its own folder, `features/leagues/LeagueSetupScreen/`.** `features/leagues/` holds three screens and a domain `types.ts` (`LeagueRecord`). A sibling `types.ts` for the screen would clash with it. `LeagueList/` and `LeaguesEmptyState/` already use a folder of their own, and the `types.ts` rule names `{ComponentName}/types.ts`. The `leagues` barrel import did not change, and the test moved with the screen.
- **`steps/` stayed where it is.** Only League Setup uses the steps, so they could move into the new folder. Not done here, to keep the task to the split.
- **No `helpers.ts`.** The screen has no code that is free of props and state. The tab labels stay in the markup.
- **Named step handlers** (`goToDetails`, `goToTeams`, `goToReview`, `handleTabChange`), as in Task 43, so the JSX has no inline arrow functions.
- **`useLeagueDraftSync` lists `detailsStepRef` as an effect dependency.** The ref is now a parameter, so lint asks for it. A ref object never changes, so the effect still runs once. The `eslint-disable` comment for the read of `detailsStepRef.current` at unmount stays, as before.

**Test approach:** a refactor with no behaviour change. The `LeagueSetupScreen` screen tests cover the draft across a remount, the focus move, the name checks, and the create. They pass with no change apart from the folder move. No hook got its own test, per the Task 42 rule. 589 tests pass.

**Docs:** the cold-cache draft rule in `docs/coding-standards.md` now points to `useLeagueDraftSync.ts`.

**What is left, what is next:** Task 45 (`FileScreen`) and Task 46 (`StatusLine`). Moving `steps/` into `LeagueSetupScreen/` is a possible small follow-up.
