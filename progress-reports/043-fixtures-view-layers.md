# Task 43 — `FixturesView`: three-layer split

**What was built:** `FixturesView` now follows the three-layer rule from Task 42. No behaviour changed.

| File                | Holds                                                                                                                                               |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `FixturesView.tsx`  | The markup only, 180 lines (283 before)                                                                                                             |
| `types.ts`          | `FixturesViewProps` (default), `MatchdayNav`, `FixtureRow`, `Fixtures`, `MatchIdentity`                                                             |
| `helpers.ts`        | `SCORE_FLASH_MS`, `fixtureKey`, `scoreText`, `flashAttr`                                                                                            |
| `useFixtures.ts`    | The main hook. It joins the other two hooks, the team lookup, and the results into rows ready to render, with one `scorinate` handler for each row. |
| `useMatchdayNav.ts` | The visible matchday, `totalMatchdays`, `canGoBack`, `canGoForward`, `leagueCompleted`, `atCurrentMatchday`, and one handler for each jump button   |
| `useScoreFlash.ts`  | The flash state, the effect that finds generated results, and the timers. It returns `isFlashing(match)`.                                           |

**Decisions made:**

- **One main hook, two hooks for one concern each.** The component calls only `useFixtures`. `useFixtures` calls `useMatchdayNav` and `useScoreFlash`. So the component has one entry point, as `StandingsView` does.
- **The jump buttons get named handlers and flags** (`goToFirst`, `canGoBack`, and so on), not inline arrow functions with conditions. The `disabled` and `onClick` logic left the JSX.
- **The row key is now `fixtureKey(fixture)`**, which adds the matchday to the old `home-away` key. Keys only need to be unique inside one list, so this changes nothing visible.
- **`totalMatchdays` starts from 0** (`Math.max(0, ...)`), so a league with no fixtures gives 0, not `-Infinity`. Before, the early return hid that case. Now the hooks run before the early return, so the guard matters.
- **The long doc comment split in two.** The flash part is on `useScoreFlash`, and the scorination part is on `useFixtures`.

**Test approach:** a refactor with no behaviour change. The 26 `FixturesView` screen tests cover the flash, the jump buttons, the bye, the scorinate buttons, and the narrow layout. They pass with no change. No hook got its own test: none is shared, and the screen tests reach all their logic, per the Task 42 rule. 589 tests pass.

**What is left, what is next:** Tasks 44 and 45 (`LeagueSetupScreen`, `FileScreen`). Task 46 (`StatusLine`).
