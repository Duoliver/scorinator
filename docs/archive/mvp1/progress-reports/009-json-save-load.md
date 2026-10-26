# Task 9 — Save/Load JSON (MVP1 flat format)

**What was built:** `adapters/json-io` gained `serializeLeague` and `parseLeague`. These are pure string-in, string-out functions. They do not touch the filesystem.

The saved shape holds four things: the league config, the teams, the fixtures and byes, and any results recorded so far. The league config has a name, a home-advantage flag, and a points config. Each team has a slug, a name, a colour, a tier, and a rolled OVR.

No `Team` or `League` domain type exists elsewhere yet. So this session scoped the save-file shape (`SavedLeague` and related types, in `types.ts`) to this adapter alone. The shape reuses existing `engine` types where it can: `Tier`, `PointsConfig`, `MatchResult`, `Fixture`, and `Bye`. This follows the same pattern as `adapters/csv/types.ts`, which scoped `TeamCsvRecord` the same narrow way.

**Test approach:** plain unit tests, in `league.test.ts`. No filesystem is involved. Task 8 used the same reasoning. The `tdd` doc sets a filesystem-integration default for `adapters`, but that rule targets the atomic-write claims of `tauri-fs`. It does not target a module that never touches disk.

The tests cover three cases: a full round-trip, a round-trip with an unplayed fixture (a fixture with no matching result), and pretty-printed output. They also cover one throw case for each required-field or shape violation. These include malformed JSON, a non-object top level, a bad or missing `formatVersion`, a blank league name, an invalid tier, a blank slug, a non-array `fixtures` field, and a negative score.

**Decisions made:**
- Team records carry the already-rolled `ovr` value, not just `tier`. The spec fixes a team OVR for the whole season, once rolled. Saving only `tier` would force a silent re-roll on load. That would break "continue exactly where I left off." This call is not on the named open-items list in CLAUDE.md. This session flagged it in the same way Task 5 and Task 6 flagged their balancing details.
- `fixtures` and `results` stay as two separate arrays. A fixture never carries an embedded score. This mirrors a split the engine already makes: `fixtures` never carries a score, and `standings` already takes a plain list of match results. A match with no `results` entry means the match has no result yet. `SavedResult` adds one field, `matchday`, on top of the plain match result shape, for lookup and display.
- This session added a `formatVersion` field, set to `1` for now. `parseLeague` throws on any other value. The persistence doc, section 3, already flags a future format change: the move to a manifest-and-wrapper split. This field gives that future migration something to check against. This task adds no migration logic yet.
- `parseLeague` checks shape and type only. It checks for a missing or blank required field, a wrong type, or an invalid tier value. It does not check a cross-reference between teams, fixtures, and results. The `calculateStandings` function, in `engine/standings`, already throws a range error for a result that names a team outside the roster. It does this once the app runs the loaded data through it. Task 3 and Task 4 used this same range-error guard pattern. So this task does not repeat that check.
- The output uses pretty-printed JSON, two-space indent. This keeps a saved file easy for a person to read and diff, at low cost.

**What is left, what is next:** this task covers serialization only. It turns a save object into a JSON string, and back. It does not read or write an actual file.

No task on the board yet covers the `tauri-fs` disk work: the open and save dialog, and the atomic write. Task 17, Save/Load UI, will need that work on top of this task. This session flagged the gap as a new row in the status board in `PROGRESS.md`, instead of leaving it unstated.
