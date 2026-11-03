# Task 142: Seed List

**Status:** Done (2026-11-03)

## Goal

Add the Seed List sub-tab to a bracket phase: each qualifier with its seed, its colour, its name, and a tag for its place in the phase before. A star on each row gives or takes a bye. A bye change after the first result asks for a confirm, because it clears every result of the bracket.

Stories: US-04.2 (the Seed List rows and tags), US-04.10 (the stars, the counts, the bye change confirm), US-07.2 (the qualifiers of a Bracket next phase). The screen rows only. Task 139 gives `setBracketByes`.

## Acceptance criteria

### The sub-tabs

- [x] A bracket phase has two sub-tabs: "Bracket" and "Seed List" (US-04.2). "Bracket" opens first.

### The rows (US-04.2, US-07.2)

- [x] One row for each qualifier, in seed order: the seed, the swatch and name, the tag, and the star.
- [x] The tag gives the place in the phase before: "A1" for the winner of Group A, "C3" for a best-M team from Group C, "3rd" after a round-robin phase. A first-phase bracket shows no tag.

### The byes (US-04.10)

- [x] The star is filled for a team with a bye, and empty for the others.
- [x] Above the rows: the text "Top seeds get a bye by default. Star any seed to grant it a bye instead — first-round only." and the count "1 / 2 byes assigned".
- [x] With no byes: "8 qualifiers fill the bracket exactly — no byes needed.", and every star is disabled.
- [x] A click on an empty star gives that team a bye. A click on a filled star takes the bye away. When all byes are assigned, the empty stars are disabled.
- [x] Before the first bracket result, a star click applies at once (`setBracketByes`).
- [x] After the first result, a star click opens a confirm first. "Cancel" changes nothing. The confirm button "Clear & change byes" clears every result of the bracket and applies the change.
- [x] With too few byes, the Bracket sub-tab shows "Assign 1 / 2 byes to play the first round." (Task 141).
- [x] Type check, lint, Prettier, and the full test suite pass.
- [x] The user checks the Seed List in the real app.

## Out of scope

- Byes after the first round (US-04.10).
- A Shuffle of the first-phase draw, and seeded pots: not in MVP2 (US-04.2).

## Notes

- **2026-11-03:** Facts from the code.
  - Task 141 gives a bracket phase one "Bracket" tab (`LeagueDetailScreen/helpers.tsx`, `getLeagueTabs`).
  - Task 139 gives `setBracketByes`. It clears every result when the bracket has one, and allows too few bye teams.
  - `phaseStandings` (`app/state/phases.ts`) gives the final tables of the phase before. A Groups phase gives one table for each group, in group order.
  - The handoff Seed List: rows of seed, swatch and name, tag, and a star button, under a line with the helper text and a "x / y byes assigned" chip. It sits in a box of about 520px.
- **2026-11-03:** Proposed choices, for the user to agree before the work starts:

  | # | Choice | Effect | Undo cost |
  |---|---|---|---|
  | 1 | The sub-tab order: "Bracket", then "Seed List", as US-04.2 lists them. The handoff puts the Seed List first. | The tree shows first. | Low |
  | 2 | The tags come from the final tables of the phase before: the group letter and the place ("A1"), or the place as an ordinal ("3rd"). | No new stored data. | Low |
  | 3 | The rows use the `Table` primitive, with 4 columns: "#", "Team", "From", and the star. The "From" column is not there for a first-phase bracket. | The Seed List looks like the other tables of the app. | Low |
  | 4 | The star is a button with `aria-pressed` and the name "Bye for <team>". It shows "★" or "☆". | A screen reader says if the team has a bye. | Low |
  | 5 ⚠ | The confirm text: title "Clear bracket results?", message "This will clear every result of the bracket. Continue?", button "Clear & change byes". US-04.10 says to re-use the US-04.6 title "Clear later rounds?", but a bye change clears the first round too. | The text says what happens. One story line changes. | Low |

- **2026-11-03:** The user agreed the criteria and choices 1 to 5. US-04.10 now has the confirm text of choice 5.

- **2026-11-03:** Test order. The helper tests and the view tests ran red first. The League Detail test changed after the code.
- **2026-11-03:** Look check by Claude: a temporary Vite demo of a Seed List after a Groups phase, in headless Chromium. The tags (A1, B1, A2), the filled and empty stars, the help text, and the count chip show as agreed. The demo is deleted.
- **2026-11-03:** The user checked the real app and agreed that the task is Done. The review found same-group ties in the first round: a rule gap, not a Task 142 fault. It goes to Task 185.

## Report

- **What was built:**
  - `features/bracket/SeedList/`: the view, `useSeedList`, and the helpers (`ordinal`, `seedTagsOf`, `describeByes`, `buildSeedRows`, `toggleBye`).
  - League Detail: a bracket phase has the "Bracket" and "Seed List" sub-tabs.
  - The bye stars call `setBracketByes`. After the first result, the "Clear bracket results?" confirm opens first.
  - US-04.10: the confirm text of choice 5.
- **Test approach:** 27 new tests, 1672 tests in total.
  - Helpers: the ordinals, the round-robin and Groups tags, the bye texts, the star states, and the toggle.
  - View, through the real store: the rows with no tag column, the default byes, a star change before a result, the no-byes text, the confirm with Cancel and Clear, and the tags of a later bracket.
  - League Detail: the "Seed List" sub-tab with the "A1" tag after a Groups phase.
- **Decisions made:** choices 1 to 5 above, in the `PROGRESS.md` Decisions log on 2026-11-03.
- **What is left, what is next:**
  - The user checks the Seed List in the real app.
  - Next: Task 143, the M4 smoke check.
