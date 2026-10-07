# Task 54 — Match lookup in one place, in `engine/`

**What was built:** The `(matchday, home, away)` match check had 5 copies in 5 modules. It now has one home, `engine/fixtures/schedule.ts`, and `features/scorination/` is gone. The plan was agreed with the user on 2026-10-07: `engine/`, not `domain/`, with plain arrays as input.

| File | Change |
|------|--------|
| `engine/fixtures/schedule.ts` (new) | `isSameMatch`, `matchKey`, `findResult`, `isMatchdayFullyPlayed`, `findCurrentMatchday`. Each one takes arrays of fixtures and results, generic over `TeamId`. |
| `engine/fixtures/types.ts` | New `MatchIdentity<TeamId>`, from `features/fixtures/types.ts`. |
| `engine/scorination/scorination.ts` | New `playMatch(homeOvr, awayOvr, homeAdvantage, rng)`: the home-advantage boost, then `scorinateMatch`. |
| `app/state/leagueActions.ts` | `isResultOf` is gone (now `isSameMatch`). `playFixture` keeps the OVR lookup and the fresh seed, and calls `playMatch`. |
| `app/data/leagueFile.ts` | The fixture check in `savedToLeague` uses `isSameMatch`. |
| `adapters/txt/resultsTxt.ts` | Its own `matchKey` is gone. It uses the engine `matchKey`. |
| `features/fixtures/` | `fixtureKey` and `MatchIdentity` are gone. The hooks call the engine lookups with `league.fixtures` and `league.results`. |
| `features/scorination/` | Deleted. Its tests moved to `engine/fixtures/schedule.test.ts`. |
| `docs/mvp1-to-mvp2-impact-review.md` | Line 94 names the new functions. |

**Decisions made:**

- **Plain arrays, not a `LeagueRecord`.** `engine/` stays free of the app's record shape, so it can be extracted or rewritten alone. The caller writes `findCurrentMatchday(league.fixtures, league.results)`.
- **Round-robin lookups, next to the generator.** They use the matchday, so they do not fit a bracket. MVP2 single duels and groups make the same `Fixture` shape, so these lookups serve them too. No subfolders.
- **`matchKey` uses JSON, not a joined string.** The old `fixtureKey` gave `1-fc-a-b` for both `fc` vs `a-b` and `fc-a` vs `b`. Slugs hold hyphens, so two matches could share a row key and a flash key. A test covers this case.
- **`playMatch` takes the OVRs, not a fixture.** My plan said `playMatch(fixture, ...)`. The fixture is only copied into the result, so `leagueActions` does that copy, and `engine/scorination` needs no import from `engine/fixtures`.
- **`playFixture` writes the result fields one by one,** not `...fixture`, so a field added to `Fixture` later does not go into a saved result by accident.

**Test approach:** Tests first. The new `schedule.test.ts` and the two `playMatch` tests failed (missing module, missing export), then passed. The `playMatch` tests compare it with `scorinateMatch` on the same seed, 50 seeds each, with and without home advantage. No exact score is asserted, per `ENGINE.md`. The 12 old `resultLookup` tests became 17 engine tests. 608 tests pass in 59 files, including the smoke test from Task 50. `format:check`, `type-check`, and `lint` are clean. A search for `features/scorination`, `resultLookup`, `isResultOf`, and `fixtureKey` finds nothing in `src/` or `docs/`, except older progress reports.

**Open question added:** the rename of `engine/fixtures` to `engine/round-robin`, for MVP2.

**What is left, what is next:**

- `PlaygroundScreen` still calls `applyHomeAdvantage` and `scorinateMatch` itself. It could call `playMatch`. Left for Task 69.
- In MVP2 the triple is not unique across phases, ties, and replays (`mvp1-to-mvp2-impact-review.md`, open decision 3). The lookups now take one schedule, so a caller can pass one group or one phase. Ties and replays still need that decision.
