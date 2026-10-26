# Task 8 — Team CSV import/export

**What was built:** `adapters/csv` now exports `parseTeamsCsv` and
`serializeTeamsCsv`, plus the `TeamCsvRecord` type (`slug`, `name`,
`colour`, `tier`). A generic `csv.ts` layer handles RFC4180-style quoting
(`parseCsv`, `stringifyCsv`), with no team-specific knowledge. `teams.ts`
sits on top of it. It adds header matching and validation.

**Test approach:** All unit tests, no filesystem. `docs/tdd.md` asks for
integration tests, against a real temp filesystem, for `adapters/`. That
rule targets `tauri-fs` and its atomic-write and crash-safety claims. This
module is a pure string transform: `TeamCsvRecord[]` to CSV text and back.
Real disk I/O stays in `tauri-fs` and in `features/`, added later. So the
module fits the `persistence/`-style rule instead: pure decision logic
gets a unit test. 20 new tests cover quoting edge cases (embedded comma,
quote, newline), header-driven parsing (order-independent, tolerant of an
unknown extra column), validation errors (missing header, blank required
cell, invalid Tier), and round-trip checks in both directions.

**Decisions made:**
- Row shape: `TeamCsvRecord { slug, name, colour, tier }`. `tier` reuses `Tier` from `engine/tier-ovr/types`. Validation reuses `TIER_ORDER` from that same module, rather than a second list.
- Column headers: `Slug`, `Name`, `Colour`, `Tier`. The `ID/slug` name in the spec points to the MVP1 identity value. The decision log for Task 11 already settled on slug only, no UUID, for MVP1, so the header reads `Slug`. `Colour` stays singular, matching the one-hex-value-per-team shape in the Teams design prototype.
- Parsing is header-driven, case-insensitive, and order-independent. It ignores an unknown extra column, so a file carrying a future MVP3 `City` column does not break import. This only shapes for extensibility. It does not build MVP3's City field itself.
- `slug` may be blank on import. The adapter passes it through untouched. Generating one is a job for Task 11 (`engine/identity`'s `slug()`) or Task 12, not for this adapter.
- `name` and `tier` are required in each row. A blank value, or an unrecognized `Tier`, throws an error that names the row.
- Export always writes all four columns. It quotes a field only when needed, and uses `\n` line endings.

**What is left, what is next:** Task 11 will need to backfill a blank
`slug` on import, or reject a duplicate one. This report does not handle
that case, since Task 8 carries no dependency on Task 11 on the status
board. Task 12 (Team Management screen) is the first consumer. It wires
actual file I/O (through `tauri-fs`, not yet built either) around these
two pure functions.
