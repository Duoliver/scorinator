# Task 154: Standings table: Form, the GD hint, and header hints

**Status:** Done

## Goal

The round-robin table gets a Form column with the last 5 results, and loses the GF and GA columns. The GD cell shows these goals in a hint. Each short header gets a hint with its full name (US-12.1 to US-12.3).

## Acceptance criteria

The user agreed the criteria on 2026-11-09.

**Form (US-12.1):**

- [x] The round-robin table has a "Form" column after Pts, with up to 5 dots, the oldest on the left.
- [x] Each dot has a letter (W, D, or L) and a colour from the Task 152 tokens.
- [x] A team with fewer than 5 matches shows fewer dots. A team with no match shows "—".
- [x] Each dot has a hint on hover and on keyboard focus: the opponent swatch, the opponent trigram in mono, "H" or "A", the score with the team's goals first, and the matchday. For example "■ ASH · H · 2–1 · MD 7".
- [x] The group cards have no Form column.

**The GD hint (US-12.2):**

- [x] The round-robin table has the columns #, Team, P, W, D, L, GD, Pts, and Form.
- [x] The GD cell of the round-robin table and of a group card has the hint "Scored 12 · Conceded 7".
- [x] The table order and the results `.txt` do not change.

**Header hints (US-12.3):**

- [x] These headers have a hint: # "Position", P "Played", W "Won", D "Drawn", L "Lost", GD "Goal difference", Pts "Points", Form "Last 5 matches". They apply to the round-robin table and the group cards.
- [x] The "Agg" label of a tie card has the hint "Aggregate".
- [x] A header with a hint has a dotted underline and the help cursor, and a screen reader reads its full name.

**Tests:**

- [x] Integration tests through `StandingsView` and `BracketView`, on real results. A unit test for the `Table` header hint.

**Out of scope:** the Form in the group cards (`scorinator-future-features.md` §14). A switch to show GF and GA. Trigrams elsewhere (Task 157).

## Notes

- **2026-11-09:** Facts from the code.
  - `TableColumn.header` is a plain string, so a header hint needs a `Table` change (Task 111 left this for here).
  - `Tooltip` has `underline` for a short header, and a text trigger becomes a Tab stop.
  - `useTeamLookup` gives the name and the colour. The hint also needs the trigram. An Instance from an older file has the trigram `''` (Task 121).
  - The tie card footer is one joined string (`describeFooter`), so the "Agg" hint needs the label apart from the rest of the text.
- **2026-11-09:** Proposed choices, for the user to agree before the work starts:

  | # | Choice | Proposal | Flag |
  |---|---|---|---|
  | 1 | The header hint | `TableColumn` gets an optional `headerHint`. The header cell shows a `Tooltip` with the underline, and has the full name as its `aria-label`. | A change in `design-system/`. |
  | 2 | The dot | A circle of 1.375rem with the letter in mono, bold, at `--font-size-xs`. | ⚠ The design has sharp corners. A dot is the one round shape. Option B: a square. |
  | 3 | A missing trigram | The hint shows the opponent name in its place. | |
  | 4 | Where Form is built | `useStandings` adds the entries to each row of a round-robin table, with `getLastResults`. The 5 is a constant in `features/standings`. `useTeamLookup` also gives the trigram. | |
  | 5 | The Tab stops | Each dot and each GD cell is a Tab stop, as the stories ask for keyboard focus. | ⚠ A table of 20 teams has about 130 Tab stops. Option B: one Tab stop for each Form cell, with one hint for the 5 results. That changes US-12.1. |
  | 6 | The "Agg" hint | The tie card keeps its footer text, and only the word "Agg" gets the underline and the hint. | |
- **2026-11-09:** The user agreed the criteria and the 6 choices: a circle for the dot, and each dot and GD cell as a Tab stop.
- **2026-11-09 (user review):** The number in a GD cell gets the dotted underline and the help cursor, because it has a hint.
- **2026-11-09:** The user agreed that the task is Done.

## Report

- **What was built:**
  - `design-system/components/Table`: `headerHint` on a column.
  - `features/standings`: the Form column with its hints, the GD hint, the header hints, and no GF or GA columns. `useStandings` builds the Form entries with `getLastResults`.
  - `features/components/useTeamLookup`: the trigram.
  - `features/bracket`: a tie card holds its aggregate apart from its footer text, so the word "Agg" has its hint.
  - `src/test/textWithoutHints.ts`: a test helper, because a closed `Tooltip` stays in the DOM.
- **Test approach:** integration tests through `StandingsView` and `TieCard` on real results: the column list, each dot state, the last 5, each hint, a missing trigram, the group cards. Unit tests for the `Table` header hint.
- **Manual check:** the user checked the dots and the hints in the real app on 2026-11-09.
- **Decisions made:** choices 1 to 6 in the `PROGRESS.md` Decisions log on 2026-11-09.
- **What is left, what is next:** Task 155 replaces the qualifier tint with the zones. A table of 20 teams has about 130 Tab stops (choice 5).
