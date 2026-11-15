# Task 221: the Resume tab

**Status:** Refactor

## Goal

Give the Season view its "Resume" tab (US-13.8): one card for each league with its winner, or its first place now, and the teams in its zones, as the Task 215 demo shows it (`m2-season-view.html#resume`). A click on a card opens its League Detail.

## Acceptance criteria

- [x] The Season view has a "Resume" tab after "Playoffs", with one card for each league, in Season order.
- [x] A complete league shows its winner with the green highlight, and the teams of its zones, each with its zone colour and label (US-13.8, US-12.5).
- [x] A running league shows the same from its current standings: the team in first place, "First place now", and the zone teams.
- [x] A complete bracket shows the champion and the runner-up, and the third and fourth places when it has a third-place playoff. A running bracket shows "No winner yet".
- [x] A click on a card opens its League Detail (Task 215 round 1).
- [x] Screen tests written first (`docs/tdd.md`). The full suite, the type check, the lint, and the format check pass.

## Notes

- **2026-11-14:** Started. Inputs: US-13.8, the Task 215 demo points 9 and 10, `app/state/phases.ts` (`phaseStandings`, `getPhaseZoneView`), `app/state/finalRanking.ts` (`leagueFinalRanking`), `app/state/bracket.ts` (the bracket rules), Task 219 (the Season league view, `seasonLeagueDetailPath`). Found: a Groups phase has one table for each group, and the demo shows a round robin and a bracket only. Choices sent to the user.
- **2026-11-14:** The user agreed the eight choices: (1) the last started phase, place 1 and the zone teams. (2) "Champion" or "First place now", with the green highlight. (3) A Groups phase: the first place of each group, "First in Group A". (4) The bracket places, and "No winner yet". (5) "No results yet." before the first result. (6) The card is a link, with the name and the progress badge. (7) `TeamName` with the Location hint. (8) No tab row action, and "No leagues yet.".
- **2026-11-14:** Tests first: the card content (6 cases) and the Resume tab (3 cases) failed, then passed. The Task 213 tab test now expects three tabs.
- **2026-11-14:** Claude choices in the code, for the review:
  - (a) A card head has the badge text and tone of the league card: "MD 12/30", "Quarter-finals", or "Complete".
  - (b) The third and the fourth place of a bracket show only when it has a third-place playoff and four seeds or more.
  - (c) "No winner yet." ends with a full stop, as "No results yet." does.
  - (d) The group rows have no highlight: no group leader is the winner of the league.
  - (e) The card lifts by one pixel on a hover, and gets the accent border on a keyboard focus.
- **2026-11-15:** The user agreed the review, with the Claude choices (a) to (e). Commit 1. The refactor pass is next.

## Report

- **What was built:** `features/seasons/SeasonViewScreen/ResumeTab` (the cards, `getResumeContent`), `useResume`, and the "Resume" tab after "Playoffs", with no tab row action.
- **Test approach:** unit tests for the card content (6 cases, with leagues played through the store actions): no result, a running and a complete round robin with a zone, a Groups phase, a running bracket, and a complete bracket with a third-place playoff. Screen tests (3 cases): the card link, the first place now, and an empty Season. The full suite passes: 2329 tests. The type check, the lint, and the format check pass.
- **Decisions made:** the eight choices (Decisions log). The Claude choices (a) to (e) are in the notes.
- **What is left, what is next:** Task 253 (the fixtures hint), then Task 222, the M2 smoke check. A live check: open the Resume tab of a Season with a running league, a complete league, and a bracket.
- **Refactor:** waits for the review.
