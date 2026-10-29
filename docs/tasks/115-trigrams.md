# Task 115: trigrams: the auto trigram, the format check, the league pick

**Status:** Done

## Goal

Build the pure trigram rules of US-09.6 in `engine/identity`, so that the Teams screen (Task 119), the CSV (Task 117), and the wizard (Task 121) share one set of rules. No screen uses them in this task.

## Acceptance criteria

The user agreed these criteria and the five choices below on 2026-10-29.

**The trigram made from the name:**

- [x] The first three letters or digits of the name, uppercase. "Ashfield Rovers" gives `ASH`. "1. FC Köln" gives `1FC`.
- [x] A name with fewer than 3 gives `X` for each missing place: "FC" gives `FCX`.

**The format check:**

- [x] A trigram is exactly 3 characters, A to Z or 0 to 9. A lowercase letter becomes uppercase.
- [x] A list parse takes the text of the drawer field or the CSV column, split by spaces. It gives the list, or the first problem: a bad trigram, a duplicate, or more than 5.
- [x] An empty text gives an empty list.

**The league pick:**

- [x] One pure function. In: each team with its id, Tier, OVR, trigram list, name, a lot value, and an optional fixed trigram. Out: one trigram for each team, unique in the league, and a flag for a team that got the digit fallback.
- [x] A fixed trigram is taken first. Then the teams pick by higher Tier, then higher OVR, then the lot. Each takes the first free trigram of its list, or the trigram made from its name when the list is empty.
- [x] With no free trigram, the team takes its first trigram with the last character changed to a digit, from 2 to 9, the first one free: `ASH` gives `AS2`.
- [x] The same input gives the same result.
- [x] Unit tests for each rule: the Tier order, the OVR order, the lot, a fixed trigram, the empty list, the digit fallback, and the same result.

**Code:**

- [x] The functions are in `engine/identity`, with no import from outside `engine/`.
- [x] `npm run lint`, `npm run format:check`, `npm run type-check`, and `npm test` pass.

**Out of scope:** the drawer field, the Teams column, and the CSV column (Tasks 117, 119). The wizard pick and the Edit field (Task 121). The display places (Task 157). The lot values from the league UUID (Task 124).

## Notes

- **2026-10-29:** Facts from the code and the specs. `slug()` already strips accents with `NFKD`. `TIER_ORDER` lists the Tiers from S to F. US-09.6 uses the fixed lots of Task 78, a hash of the league UUID and each team UUID. In the wizard, no league UUID exists before "Create league", and Task 124 builds the lots.
- **2026-10-29:** A first test of the fallback order was wrong: its team still had a free trigram in its list, so no fallback ran. The test now takes that trigram too.
- **2026-10-29 (review):** The user found that the test "gives null for a text that is no trigram" had lowercase input only. It now has uppercase input too: `AS`, `A-H`, `ASHF`, `ÉVO`, and an empty text. A typed trigram with an accent is not valid: only the name trigram strips accents.

## Choices for discussion

| # | Choice | Effect | Undo cost |
|---|---|---|---|
| 1 | A letter with an accent counts as its base letter: "Évora" gives `EVO`. Other symbols are skipped. | The same rule as the slug. | Low |
| ⚠ 2 | The pick takes a lot value for each team from the caller. It does not make the Task 78 hash. | The engine needs no league UUID. Task 121 decides where the wizard gets the lots. | Medium |
| 3 | When `AS2` to `AS9` are all taken, the fallback tries the next trigrams of the list the same way, then two digits (`A10` to `A99`). | Two teams never share a trigram. US-09.6 does not cover this case. | Low |
| 4 | The list parse gives a problem code, not a message. | The screen writes the message (Task 119), as other engine checks do. | Low |
| 5 | Two fixed trigrams that are the same are a caller bug: the pick throws. | The wizard checks the Edit field first (Task 121). | Low |

## Report

- **What was built:** `engine/identity/trigram.ts`: `trigramFromName`, `isTrigram`, `normalizeTrigram`, `parseTrigramList` (with a problem code), `pickTrigrams` (generic over the team id, with the `fallback` flag), and `MAX_TRIGRAMS`. All exported from `engine/identity`.
- **Test approach:** unit tests, 25 new: the name trigram (accents, symbols, `X` padding), the format, the list parse (order, blank, bad, duplicate, more than 5), and the pick (own list, empty list, Tier, OVR, lot, fixed first, the digit fallback with its flag, a taken digit, the next trigram then two digits, unique codes, the same result in any input order, and two errors). Full suite: 809 tests pass. At review, the null test got uppercase input. Lint, format check, type check, and `npm run build` pass.
- **Decisions made:** the five choices above, agreed by the user. Claude choices: the lower lot picks first. Two teams with the same Tier, OVR, and lot pick in input order. A list entry is used as given: the parse checks it first. A team with no free fallback at all, past `A99`, makes the pick throw.
- **What is left, what is next:** no screen uses the rules yet. Task 117 reads the CSV column with `parseTrigramList`. Task 119 adds the drawer field and the Teams column. Task 121 runs the pick in the wizard, and decides the lot values.

