# Task 103: UUID v4 with an injected source, and the unique slug function

**Status:** Done (2026-10-29)

## Goal

Give `engine/identity` the pure functions that the MVP2 data model needs first. One makes a UUID v4 from an injected random source, so that the tests are reproducible (US-11.1, `ENGINE.md`). The other makes a slug that is unique in a list, with the `-2` rule (Task 75, US-09.5). A third function checks the UUID format. This task adds engine code only. Task 104 and later tasks use the functions.

## Acceptance criteria

**UUID v4 (US-11.1):**

- [x] The byte source has the type `RandomBytes = (length: number) => Uint8Array`. The app gives `crypto.getRandomValues` later (Task 108).
- [x] `uuidV4(randomBytes)` returns a lowercase UUID v4 string in the form `xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx`, where `y` is `8`, `9`, `a`, or `b` (RFC 9562).
- [x] The function takes an injected byte source and never calls `crypto` or `Math.random()` itself.
- [x] The same source bytes always give the same UUID. A test checks a fixed source against a known UUID.
- [x] The function sets the version and variant bits, whatever the source bytes are. A test uses all-zero bytes and all-`0xff` bytes.
- [x] A test makes many UUIDs from one seeded source, and finds no duplicate.
- [x] A source that gives a number of bytes other than 16 makes the function throw a `RangeError`.
- [x] `isUuidV4(value)` returns `true` only for a lowercase UUID v4 string. It returns `false` for upper case, the nil UUID, another version, a bad variant, and a value that is not a string. A file parser uses it before it trusts a value (Task 106).

**Unique slug (Task 75, US-09.5 rule):**

- [x] `uniqueSlug(name, taken)` returns `slug(name)` when that slug is not in `taken`.
- [x] When it is in `taken`, it returns the first free slug of `base-2`, `base-3`, and so on.
- [x] It finds a gap: with `ashfield` and `ashfield-3` taken, it returns `ashfield-2`.
- [x] A team name that ends in a number works: with `team` and `team-2` taken, the name "Team" gives `team-3`.
- [x] The caller leaves the slug of the Blueprint itself out of `taken`. A test shows that a regenerate then gives no clash with the Blueprint itself (US-09.5).
- [x] A blank or symbols-only name throws the same `RangeError` as `slug()`.
- [x] The function is pure: it does not change `taken`.

**General:**

- [x] All three functions and the `RandomBytes` type are exported from `engine/identity/index.ts`.
- [x] The doc comment of `slug()` no longer says that it is the job of a later system to make a slug unique.
- [x] No other code changes. No caller uses the functions yet.
- [x] `npm run lint`, `npm run format:check`, `npm run type-check`, and `npm test` pass.

**Out of scope:** the real byte source (`crypto.getRandomValues`) in `app/`, the installation UUID, and the provenance fields. These come with Tasks 104, 107, and 108. A clock source is not necessary, because no MVP2 provenance field holds a time.

## Notes

- **2026-10-29:** Facts from the code. `engine/identity` has only `slug()`. `engine/rng.ts` has the `Rng` type (a float from 0 to 1) and `createSeededRng` (mulberry32, 32-bit state). `adapters/tauri-fs/atomicWrite.ts` calls `crypto.randomUUID()` for temp file names. That is an adapter, so the engine rule does not apply to it.
- **2026-10-29:** Claude proposed the criteria above, with three choices for the user: the shape of the byte source, how the caller leaves out its own slug, and a UUID format check.
- **2026-10-29:** The user agreed the criteria and chose: (1) a byte source, not the engine `Rng`, (2) the caller removes its own slug from `taken`, (3) add `isUuidV4` now. Claude added two criteria from these answers: the 16-byte check, and the `isUuidV4` cases. The check accepts lower case only, because the app writes lower case only, and a string compare of two UUIDs must not depend on case.
- **2026-10-29:** The user agreed that the task is Done. It is the first task committed under the Task 159 commit workflow.

## Report

- **What was built:** three pure functions in `engine/identity`. `uuidV4(randomBytes)` makes a lowercase UUID v4 from 16 injected bytes (`uuid.ts`). `isUuidV4(value)` checks the format. `uniqueSlug(name, taken)` makes a slug with the first free `-2`, `-3` suffix (`slug.ts`). The `RandomBytes` type is in `types.ts`. The barrel exports all four.
- **Test approach:** unit tests, 24 new (`uuid.test.ts`: 13, `slug.test.ts`: 11). The UUID tests use fixed bytes for exact results, and a seeded source for 10,000 UUIDs with no duplicate. The slug tests cover the free slug, the suffix, a gap, a name with a number, the own-slug case of a regenerate, purity, and the `RangeError`. Full suite: 681 tests pass. Lint, format check, and type check pass.
- **Decisions made:** the three user choices and the lowercase-only check, in the Notes above and in the `PROGRESS.md` Decisions log on 2026-10-29.
- **What is left, what is next:** no caller uses the functions yet. Task 104 adds the record types with a UUID. Task 108 gives the real byte source (`crypto.getRandomValues`) from `app/`. The MVP1 callers of `slug()` (`TeamForm`, `importMerge`, `leagueActions`, `leagueFile`) move to `uniqueSlug` in Tasks 108, 117, and 119. A test helper that makes seeded bytes lives in `uuid.test.ts` only. A later task can move it to a shared test file when a second test needs it.
