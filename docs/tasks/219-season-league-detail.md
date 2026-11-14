# Task 219: the league cards and League Detail in a Season

**Status:** Refactor

## Goal

Show the leagues of a Season as cards in the Season view (US-13.3), and open each one in League Detail, under the breadcrumbs of its Season, read only in a finished Season (US-13.6, US-13.9). The Task 215 demo shows both (`m2-season-view.html`, `m2-league-detail.html`). Task 216 gives the store, Task 218 the wizard.

## Acceptance criteria

- [x] The Season view shows one card for each Season league, as the leagues dashboard does (Task 215 point 1).
- [x] "Open standings" on a card opens League Detail at `/seasons/:uuid/leagues/:leagueUuid`.
- [x] League Detail in a Season shows the breadcrumbs "Seasons › {Season} › {league}" in place of "← Leagues" (Task 215 point 7).
- [x] Every League Detail action works on a Season league: scorinate, the bracket, the byes, the next phase, the groups, the zones (US-13.6).
- [x] In a finished Season, League Detail shows a notice, and each control that changes the league is disabled (Task 215 point 11, US-13.9).
- [x] After "Create league" in a Season, the wizard opens the new League Detail.
- [x] The standalone leagues work as before.
- [x] Screen tests written first (`docs/tdd.md`). The full suite, the type check, the lint, and the format check pass.

## Notes

- **2026-11-14:** Started. Inputs: US-13.3, US-13.6, US-13.9, the Task 215 demo points 1, 7, and 11, Task 216 (`LeagueRef`, `findLeagueWrapper`, `seasonLeagueDetailPath`), Task 218 choice 10. Found: the views (`FixturesView`, `BracketView`, `SeedList`) and `useLeagueDetail` call the actions with `league.uuid`. The card list (`LeagueList`) and its texts (`leagueSummary.ts`) live in `features/leagues`, so the Season view cannot import them. Choices sent to the user.
- **2026-11-14:** The user agreed the eight choices: (1) one League Detail with a `seasonUuid` prop, and the Season opens from its file when needed. (2) The breadcrumbs, and the "Unsaved" badge of the Season. (3) Optional `leagueRef` and `readOnly` props on the views. (4) In a finished Season, a notice and every change control disabled. (5) No "Export" menu in a Season league until Task 247. (6) `LeagueList` and `leagueSummary.ts` move to `features/components/`. (7) The cards in Season order, with no "Unsaved" badge. (8) After the create, the new League Detail.
- **2026-11-14:** Tests first. League Detail in a Season (11 cases), the Season view cards (1), the route (1), and the new create target (1) failed, then passed.
- **2026-11-14:** Claude choices in the code, for the review:
  - (a) While a Season league opens, or when it is not found, the screen shows "← Seasons" in place of the breadcrumbs: the Season name is not known yet.
  - (b) The finished notice has the look and the text of the Season view notice. The CSS rule is in both CSS modules.
  - (c) The hint "Phase N started. This phase is locked." stays for an earlier phase only. A finished Season shows the notice at the top instead.
  - (d) In a finished Season, each tie card button and each Seed List star is disabled, as the scorinate buttons are.
  - (e) A Season view card comes from `summarizeLeague` of the Season league view, so it says what the dashboard card says.
  - (f) `FEATURES.md` no longer lists `leagueSummary.ts` and `LeagueList` in its `features/leagues` tree.
- **2026-11-14:** The user agreed the review and the Claude choices (a) to (f). Commit 1. Status Refactor.

## Report

- **What was built:**
  - `features/components/`: `LeagueList` and `leagueSummary.ts`, moved from `features/leagues`. A card gets its link from the caller.
  - `features/fixtures`, `features/bracket`: optional `leagueRef` and `readOnly` props on `FixturesView`, `BracketView`, and `SeedList`.
  - `features/leagues/LeagueDetailScreen`: the `seasonUuid` prop. `useLeagueDetail` reads the league by its address, opens the Season, follows the Season for "Unsaved", and turns off every change control in a finished Season. The breadcrumbs, the notice, and no Export menu for a Season league.
  - `features/seasons/SeasonViewScreen`: the league cards.
  - `app/`: the route `/seasons/:uuid/leagues/:leagueUuid`. The wizard opens the new League Detail after the create.
- **Test approach:** screen tests with Testing Library (`LeagueDetailScreen.season.test.tsx`, 11 cases): the breadcrumbs, a scorinate and the "Unsaved" badge, the bracket, no Export menu, the open from the file, a league not found, and the finished state for the fixtures, the zones, the bracket, and the byes. One Season view card test, one AppShell route test. The standalone League Detail and view tests pass with no change. The full suite passes: 2304 tests. The type check, the lint, and the format check pass.
- **Decisions made:** the eight choices (Decisions log). The Claude choices (a) to (f) are in the notes.
- **What is left, what is next:** Task 220 (the Playoffs tab) and Task 221 (the Resume tab). Task 247 adds the Export menu of a Season league. A live check: open a Season, open a league card, scorinate, then finish the Season and open the league again.
- **Refactor:** waits for the review.
