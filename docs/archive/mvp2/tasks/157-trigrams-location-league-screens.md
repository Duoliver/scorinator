# Task 157: Trigrams and Location on league screens

**Status:** Done

## Goal

The league screens show the team trigram where a name does not fit, and in each fixtures row (US-09.6). A team name in the standings table, the group cards, and the bracket tie cards shows the team Location in a hint (US-09.3).

## Acceptance criteria

Proposed on 2026-11-10. The user agreed them on 2026-11-10.

**Trigrams (US-09.6):**

- [x] The round-robin standings table shows the trigram in place of the name when its box is narrower than 47.5rem (choice 1).
- [x] A group card shows the trigram in place of the name when the card is narrower than 20rem (choice 1).
- [x] Each fixtures row shows the trigram of each team in muted mono text, beside its swatch (choice 3).
- [x] A team with no trigram keeps its name and shows no trigram (choice 5).

**The Location hint (US-09.3):**

- [x] In the standings table, the group cards, and the bracket tie cards, a team with a Location gets a hint on its name. The hint shows on hover and on keyboard focus.
- [x] A team with no Location, or a deleted Blueprint, shows no hint and is not a Tab stop.
- [x] When the trigram shows in place of the name, the hint gives the name and the Location (choice 2).
- [x] The Location comes from the Blueprint, so an edit shows in each league at once.

**Tests:**

- [x] Integration tests through `StandingsView`, `FixturesView`, and the bracket view.

**Out of scope:** the full-name hint on a cut name (Task 180). The Location in the fixtures rows, the chart, or the results `.txt` export.

## Notes

- **2026-11-10:** Facts from the code.
  - `useBlueprintLocation` in `LeagueSetupScreen/` reads the Location from the Blueprint. The Teams step and the Review step use it.
  - `Tooltip` makes a text trigger a Tab stop.
  - The round-robin table has a 47.5rem minimum width, and scrolls below it. A group card is 17.5rem wide at least.
  - The fixtures row is "name, swatch, score, swatch, name". The home name sits on the left of its swatch.
  - jsdom has no layout, so the tests can check the markup of both texts, but not the width switch.
- **2026-11-10:** Proposed choices, for the user to agree before the work starts:

  | # | Choice | Proposal | Flag |
  |---|---|---|---|
  | 1 | The width switch | CSS container queries. The name shows by default, and the trigram only under the width. Under 47.5rem, the round-robin table also drops its minimum width to 30rem, so it scrolls later. | ⚠ Two balancing values: 47.5rem and 20rem. ⚠ An old WebKitGTK with no container queries keeps the names, with no error. |
  | 2 | The hint text | The Location. With the trigram in place of the name: "FC United · Coastal City", or the name only with no Location. Then each trigram is a Tab stop. | |
  | 3 | The fixtures trigram | Beside each swatch, so the row reads "FC United UNI ■ 2–1 ■ RIV FC Rivals". | ⚠ The story says "after the name". This proposal puts the away trigram before its name, so the row is symmetric. |
  | 4 | The shared hook | `useBlueprintLocation` moves to `features/components/`. The leagues, standings, fixtures, and bracket folders need it. | A move of existing code. |
  | 5 | A missing trigram | A league file from before Task 121 has `''`. The name stays in a narrow box, and the fixtures row shows no trigram. | |
  | 6 | Task 180 | Not part of this task. Task 180 can later add the full name to the same hint. | |
- **2026-11-10:** The user agreed the six choices, 47.5rem and 20rem for choice 1, and the criteria.
- **2026-11-10:** Found during the work: the fixtures CSS already uses container queries (Task 39), so the WebKit risk of choice 1 was already taken.
- **2026-11-10:** Review change: both hints of `TeamName` are `notHoverable`, so the pointer goes through them to the rows under them. Three tests check the `data-not-hoverable` mark.
- **2026-11-10:** Review change: the Form dot hints (Task 154) are `notHoverable` too, at the user request. One test checks the mark.
- **2026-11-10:** The user checked the real app and agreed that the task is done.

## Report

- **What was built:** a shared `TeamName` in `features/components/` shows a team name with its Location hint, and holds the trigram for a narrow box. The standings table and the group cards use it, with container queries at 47.5rem and 20rem. Each fixtures row shows both trigrams beside the swatches. The bracket tie cards show the Location hint. `useTeamLookup` now gives the Location, from the moved `useBlueprintLocation`.
- **Test approach:** integration tests through `StandingsView` (6), `FixturesView` (2), and `BracketView` (2), and a `useTeamLookup` test for the Location and a Blueprint edit. They check the hint on hover, the Tab stop, no hint with no Location, the trigram hint, a missing trigram, and the fixtures order. 2041 tests pass. Type check, lint, and Prettier are clean. jsdom has no layout, so the width switch needs the real-app check.
- **Decisions made:** the six agreed choices, in the `PROGRESS.md` Decisions log. In the code: the fixtures stacked layout shows "swatch, name, trigram, goals" on both lines.
- **What is left, what is next:** Task 180 can add the full name to the hint of a cut name.
