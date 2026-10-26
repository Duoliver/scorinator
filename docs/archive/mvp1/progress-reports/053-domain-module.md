# Task 53 — New `src/domain/` module for the record types

**What was built:** A new top-level module, `src/domain/`, holds the app's record types. `app/` no longer imports anything from `features/` except the screens that `AppShell` routes. The user chose the new module on 2026-10-07, from the three options in report 049.

| File | Change |
|------|--------|
| `src/domain/team.ts` (new) | `TeamRecord`, from `features/components/types.ts` |
| `src/domain/league.ts` (new) | `LeagueTeam`, `LeagueResult`, `LeagueRecord`, `CreateLeagueInput`, from `features/leagues/types.ts` |
| `src/domain/index.ts` (new) | The barrel. Every file imports from `@/domain`. |
| `src/domain/DOMAIN.md` (new) | The module rules, see below. |
| `features/leagues/types.ts` | Deleted. It held only the moved types. |
| `features/components/types.ts` | Keeps `TeamDisplay` only, a view type. |
| `app/state/leagueStore.ts` | The type re-exports and their cycle comment are gone. |
| Barrels | `features/components`, `features/leagues`, and `features/teams` no longer export the moved types. |
| 46 files in `app/` and `features/` | Import the types from `@/domain`. 23 of them are test files. |
| Docs | `docs/module-boundaries.md` (map and crossing rule), `src/features/FEATURES.md`, `docs/code-review-checklist.md` §2, and the module doc list in `CLAUDE.md`. |

**The `domain/` rules (`DOMAIN.md`):**

- Types only, for now. A function on these records waits for Task 54.
- `domain/` imports only `engine/` types.
- `app/` and `features/` import `domain/`. `engine/` never does: it stays generic over its `TeamId`. `adapters/` never does: a file format keeps its own types, and `app/data` maps between them.

**Import graph after the move:**

- `app/` imports `features/` only in `AppShell` (the routed screens and `StatusLine`).
- The two screen folders that imported each other no longer do. `features/leagues` still imports `fixtures` and `standings` (League Detail shows both views). Neither one imports `leagues` back.
- `features/fixtures` still imports `features/scorination`. Task 54 moves that folder.

**Decisions made:**

- **Two files, `team.ts` and `league.ts`, and one barrel.** Not one `types.ts`: MVP2 adds the Blueprint, Instance, and Instance Wrapper types, and each concept gets its own file.
- **The comments of the moved types now say why, not who calls them**, per the comment rule from Task 52. For example, the `CreateLeagueInput` comment says why it holds full roster records (the OVR roll needs the Tier). The old text named `LeagueSetupScreen` and `addLeague`.
- **The module doc goes in `CLAUDE.md`'s list of module docs**, next to `ENGINE.md`, since a new module with rules needs to be found at session start.

**Test approach:** No behaviour changed, so no test changed except its imports. `type-check` proves each import resolves. The smoke test from Task 50 still passes. `format:check`, `type-check`, and `lint` are clean, and 601 tests pass. A search for `features/leagues/types` and `features/components/types` finds only the `TeamDisplay` line in `FEATURES.md`, which is still correct.

**Open question resolved:** the 2026-10-07 Task 53 entry. Removed from the Open questions list.

**What is left, what is next:**

- **Task 54 needs a new decision.** Its row says the match lookup goes to `engine/`. Now that `domain/` exists, the functions that work on a `LeagueRecord` (`findResult`, `isMatchdayFullyPlayed`, `findCurrentMatchday`) fit in `domain/` too. That breaks the "types only" rule. Ask the user before Task 54 starts.
- No lint rule enforces the new crossing rule, the same as for the other modules.
