# Task 41 — Store actions in flat `*Actions.ts` files

**What was built:** Each Zustand store in `app/state/` now holds state only. Its actions are plain exported functions in a sibling file that call `setState` and `getState`. Zustand calls this the "no store actions" pattern. No behaviour changed.

| Store                 | Actions file            | Actions                                                                                    |
| --------------------- | ----------------------- | ------------------------------------------------------------------------------------------ |
| `leagueStore.ts`      | `leagueActions.ts`      | `addLeague`, `loadLeague`, `scorinateFixture`, `rescorinateFixture`, `scorinateMatchday`   |
| `teamsStore.ts`       | `teamsActions.ts`       | `addTeam`, `updateTeam`, `setTeams`                                                        |
| `fileStore.ts`        | `fileActions.ts`        | `setCurrentLeague`, `setLeaguePath`, `markLeagueSaved`, `setFileStatus`, `clearFileStatus` |
| `leagueDraftStore.ts` | `leagueDraftActions.ts` | `setLeagueDraft`, `resetLeagueDraft`                                                       |

**Renames:**

- The `fileStore` and `leagueDraftStore` actions got names with their subject (`setCurrent` became `setCurrentLeague`, `reset` became `resetLeagueDraft`, and so on). As module-level exports, the old names lost their context. `setStatus` also clashed with a local `useState` setter in `LeagueSetupScreen`.
- `app/fileActions.ts` became `app/loadActions.ts`, with its test. The old name clashed with the new `app/state/fileActions.ts`. The file holds the league load and the team import, so "load" fits, and it pairs with `saveActions.ts`.
- The store tests moved to `*Actions.test.ts`, since they test the actions.

**Other changes:**

- `addLeague` now calls `setCurrentLeague` from `fileActions.ts`, not `useFileStore.getState().setCurrent`.
- `scorinateMatchday` calls `scorinateFixture` directly, not through `get()`.
- The long `leagueStore` doc comment moved to a doc comment on each action.
- `leagueDraftStore.ts` exports `emptyLeagueDraft()`, so `resetLeagueDraft` can use it.
- `isLeagueUnsaved` stays in `fileStore.ts`. It is a pure read helper, not an action.

**Test approach:** a refactor with no behaviour change. The same 585 tests pass. Tests now import the actions and call them directly. Tests that reset a store with `setState` did not change.

**Docs:** `docs/coding-standards.md` has a new rule, "A store holds state only". The cold-cache draft store rule now shows the two actions in `xDraftActions.ts`. `docs/module-boundaries.md` mentions the `*Actions.ts` files in the `/app/state` line.

**What is left, what is next:** `leagueActions.ts` still holds `playFixture`, `isResultOf`, and `freshSeed`. `isResultOf` and the fixture play are domain logic that could move to `engine/`. Not done here, to keep this task to the file split.
