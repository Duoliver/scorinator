# Task 184: string unions to enums or named constants

**Status:** Done

## Goal

Replace the string values of the union types with named members, for example `TieFormat.TWO_LEGGED` in place of `'two-legged'`. The types already catch a wrong value. Named members also give one place for each value, a search by name, and a rename in one step. The user asked for this refactor late in MVP2, before the MVP2 smoke check (Task 158).

## Acceptance criteria

Proposed on 2026-11-10. The user agreed them on 2026-11-10.

- [x] Each union type in the scope below gets an `as const` object of the same name, with one UPPER_SNAKE_CASE member for each value (choice 1, review change).
- [x] The production code uses the members, for example `Legs.TWO_WAY`, in place of the string values of these types.
- [x] The stored values stay the same strings. The league and Blueprint files need no new format version.
- [x] The file readers take their lists of valid values from the objects, for example `Object.values(TieFormat)`.
- [x] `docs/coding-standards.md` gets a rule for a new value set.
- [x] Type check, lint, Prettier, and the full test suite pass.

**The scope (choice 2):** the value sets of the data model, in `engine/`, `domain/`, and `adapters/`:

| Module | Types |
|---|---|
| `engine/tiebreak` | `TieFormat`, `TiebreakMethod`, `TieMatchPart`, `TieDecision`, `CoinSide` |
| `engine/bracket` | `BracketTieKind`, the `kind` of a tie side (`team`, `bye`, `tbd`) |
| `engine/phases` | `Legs`, `ZoneColour` |
| `engine/round-robin` | the `by` of `GroupSetting` (`size`, `count`) |
| `engine/standings` | `MatchOutcome` |
| `engine/tier-ovr` | `Tier` |
| `engine/identity` | `ImportChoice` |
| `domain/` | `PhaseFormat` |
| `adapters/` | `SavedPhaseFormat`, `SavedFileKind`, `UnsavedChoice` |

**Out of scope:** the design-system props, for example `variant="primary"`. The `kind` and `code` fields of the result, problem, and state unions, for example `PhaseFitProblem` and `DatabaseStatus`. The feature unions, for example `TeamsStepOverlay`. The tests keep their string values (choice 3).

## Notes

- **2026-11-03:** Task created by the user, from the Task 137 review: "kind" and "format" in `engine/bracket/play.ts` use string values that could be enums or constants.
- **2026-11-03:** Facts from the code. No `enum` exists in `src/` today. `tsconfig.json` has `isolatedModules: true`, so a `const enum` across files is not safe. A string `enum` works. An `as const` object adds no runtime code beyond a plain object.
- **2026-11-03:** The union types today, about 25. Engine: `TieFormat`, `TiebreakMethod`, `TieMatchPart`, `TieDecision`, `CoinSide`, `BracketTieKind`, `Legs`, `Tier`, and the `kind` and `code` fields of the result and problem unions. Domain and adapters: `PhaseFormat`, `SavedPhaseFormat`, `LeagueProgress`, `UnsavedChoice`. Design system and features: `ButtonVariant`, `ButtonSize`, `BadgeTone`, `ConfirmTone`, `ModalSize`, `CardPadding`, `TableAlign`, `TableRowTone`, `DropdownMenuTone`, `DropdownMenuAlign`, `TeamSwatchSize`, `StatusLinePlacement`. Tasks 138 to 157 add more.
- **2026-11-10:** Review change, from the user: the members are UPPER_SNAKE_CASE, for example `PhaseFormat.ROUND_ROBIN`, in place of PascalCase. The codebase writes its constants that way, for example `TIER_ORDER`. A script renamed the members in 55 files.
- **2026-11-10:** The user reviewed the code and agreed that the task is done.

## Report

Write this before the task goes to Review.
- **2026-11-10:** Facts from the code, again.
  - The scope types appear about 250 times in the production code, and about 450 times in the tests. For example, `'bracket'` shows 108 times in the code and 104 times in the tests.
  - `tsconfig.json` has `isolatedModules: true`. A string `enum` works, but a plain string is not a valid value of an enum type. So each test, each object literal, and each file reader would need a change.
  - With an `as const` object, the type is the same union of strings as today. A plain string still compiles, so the change can go file by file.
- **2026-11-10:** Proposed choices, for the user to agree before the work starts:

  | # | Choice | Proposal | Flag |
  |---|---|---|---|
  | 1 | The form | An `as const` object and a type of the same name: `export const Legs = { TWO_WAY: 'two-way', SINGLE_DUELS: 'single-duels' } as const;` and `export type Legs = (typeof Legs)[keyof typeof Legs];`. No TypeScript `enum`. | ⚠ The compiler still takes a plain string. Only the code review keeps the members in use. |
  | 2 | The scope | The value sets of the data model only: 18 types in `engine/`, `domain/`, and `adapters/`. | The design-system props, the problem codes, and the feature unions stay strings. |
  | 3 | The tests | The tests keep the plain strings. So they also check that the stored values do not change. | |
  | 4 | One task | One task, about 3 to 4 hours, with one commit. | |
- **2026-11-10:** The user agreed the four choices and the criteria.
- **2026-11-10:** During the work.
  - `domain/` holds types only, so the `PhaseFormat` object lives in `engine/phases`. `domain/league.ts` keeps the type, from there. `SavedPhaseFormat` is now `Exclude<PhaseFormat, 'bracket'>`. The tie side `kind` gets `TieSideKind`, and the group setting `by` gets `GroupBy`.
  - A codemod with the TypeScript compiler API found the sites. It reads the expected type of each string: an assignment, a comparison, or a `case`. It changes a string only when that type holds values of one set only. So a tab id `'bracket'` stays a string. It found 303 sites in 51 files, with no unclear site. The script is not in the repo.
  - By hand: the lists of valid values in the file readers now use `Object.values`, and two records use computed keys.
  - `engine/tier-ovr` now exports the `Tier` object. The test of its exports lists it.
- **2026-11-10:** The user reviewed the code and agreed that the task is done.

## Report

- **What was built:** 17 `as const` objects, and `SavedPhaseFormat` as an `Exclude` of `PhaseFormat`, for the 18 value sets of the data model. The production code uses the members in 303 places in 51 files. The file readers take their valid values from the objects. `docs/coding-standards.md` has the rule.
- **Test approach:** a refactor with no change of behaviour. The 2041 tests pass with their plain strings, so the stored values did not change. One test changed: the list of the `engine/tier-ovr` exports. Type check, lint, and Prettier are clean.
- **Decisions made:** the four agreed choices, in the `PROGRESS.md` Decisions log. The place of `PhaseFormat` follows the `domain/` rule.
- **What is left, what is next:** the record keys and the type declarations keep their strings, as the rule says. Task 158 is next.
