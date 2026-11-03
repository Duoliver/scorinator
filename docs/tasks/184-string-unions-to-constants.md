# Task 184: string unions to enums or named constants

**Status:** Not started

## Goal

Replace the string values of the union types with named members, for example `TieFormat.TwoLegged` in place of `'two-legged'`. The types already catch a wrong value. Named members also give one place for each value, a search by name, and a rename in one step. The user asked for this refactor late in MVP2, before the MVP2 smoke check (Task 158).

## Acceptance criteria

Criteria wait for the user. Points to settle:

- [ ] The form: a TypeScript string `enum`, or an `as const` object with a type taken from it (`type TieFormat = (typeof TieFormat)[keyof typeof TieFormat]`).
- [ ] The scope: all union types, or the engine and domain types only. The design-system props (`variant="primary"`) read well in JSX as strings.
- [ ] The stored values stay the same strings, so the league and Blueprint files need no new format version.
- [ ] Type check, lint, Prettier, and the full test suite pass.

## Notes

- **2026-11-03:** Task created by the user, from the Task 137 review: "kind" and "format" in `engine/bracket/play.ts` use string values that could be enums or constants.
- **2026-11-03:** Facts from the code. No `enum` exists in `src/` today. `tsconfig.json` has `isolatedModules: true`, so a `const enum` across files is not safe. A string `enum` works. An `as const` object adds no runtime code beyond a plain object.
- **2026-11-03:** The union types today, about 25. Engine: `TieFormat`, `TiebreakMethod`, `TieMatchPart`, `TieDecision`, `CoinSide`, `BracketTieKind`, `Legs`, `Tier`, and the `kind` and `code` fields of the result and problem unions. Domain and adapters: `PhaseFormat`, `SavedPhaseFormat`, `LeagueProgress`, `UnsavedChoice`. Design system and features: `ButtonVariant`, `ButtonSize`, `BadgeTone`, `ConfirmTone`, `ModalSize`, `CardPadding`, `TableAlign`, `TableRowTone`, `DropdownMenuTone`, `DropdownMenuAlign`, `TeamSwatchSize`, `StatusLinePlacement`. Tasks 138 to 157 add more.

## Report

Write this before the task goes to Review.
