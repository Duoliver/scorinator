# Task 218: the wizard in a Season

**Status:** Refactor

## Goal

Let the user create a league in a Season with the MVP2 wizard (US-13.5), as the Task 215 demo shows it (`m2-season-wizard.html`): the Season teams first in "Add teams", the other Blueprints with a status, the join at create, the "Edit Season team" drawer, the ⇄ switch, and the breadcrumbs. Task 216 gives the store actions.

## Acceptance criteria

- [x] "+ New league" in the Leagues section of a running Season opens the wizard at `/seasons/:uuid/leagues/new`. A finished Season has the button disabled (US-13.9).
- [x] The wizard shows the breadcrumbs "Seasons › {Season} {year} › New league", and the title "New league in {Season}".
- [x] "Add teams" lists the Season teams first, with a green tint and a status ("In 1 league", "Rests"), then the other Blueprints, at full opacity, with "Not in the Season" (Task 215, point 6).
- [x] A team from outside the Season shows the badge "Joins the Season". Its OVR rolls at the add, as in MVP2 (Task 215, round 7).
- [x] ✎ on a Season team opens "Edit Season team", with a note that names the Season leagues the change reaches. Save changes the Season team (US-13.5).
- [x] ✎ on a joining team opens "Edit team", with a note that it joins the Season at create.
- [x] The ⇄ Switch dialog has the same two groups (Task 215, point 5).
- [x] "Create league" calls `createSeasonLeague`, and the league is in the Season.
- [x] The standalone wizard works as before.
- [x] Screen tests written first (`docs/tdd.md`). The full suite, the type check, the lint, and the format check pass.

## Notes

- **2026-11-14:** Started. Inputs: US-13.5, the Task 215 demo and its points 4 to 7, round 7, Task 216 (`createSeasonLeague`, `seasonLeagueNewPath`), the wizard (`LeagueSetupScreen`, `useLeagueSetup`, `useTeamList`, `TeamsStep`, the cold-cache `leagueDraftStore`), `PickerDialog` (no groups, no disabled item), `SeasonTeamDrawer` (in `features/seasons`). Choices sent to the user.
- **2026-11-14:** The user agreed the eleven choices: (1) one wizard with a `seasonUuid` prop, and the Season opens from its file when needed. (2) "+ New league" in the Season view now. (3) One draft for each container. (4) A `Breadcrumbs` primitive. (5) Item groups in `PickerDialog`. (6) The roster values of a Season team, and the create names and trigrams of a joining team. (7) `SeasonTeamDrawer` moves to `features/components/`, and its Save changes the Season at once. (8) "Edit team" for a joining team. (9) "Load them all" adds the Season teams only. (10) After the create, the Season view. (11) No "+ Create new team" in a Season wizard.
- **2026-11-14:** Tests first, in six steps. Each set failed, then passed: `Breadcrumbs` (2), the `PickerDialog` groups (5), the drafts for each container (3), the wizard in a Season (12), "+ New league" (2), and the route (1).
- **2026-11-14:** Claude choices in the code, for the review:
  - (a) With the drawer, `useSeasonTeamEdit` (it was `useTeamEdit`), `findLeagueNames`, and `formatSeasonLabel` moved to `features/components/`: the wizard needs them, and a screen folder cannot import another one.
  - (b) The wizard table keeps the MVP2 columns: the Tier, with no OVR. The Task 215 demo showed the Tier and the OVR in one box.
  - (c) A Season team whose Blueprint was deleted is not an item of the dialogs: the add needs the Blueprint.
  - (d) A joining team cannot fix a trigram of the roster: the Edit drawer counts the roster trigrams as taken.
  - (e) When a fixed trigram breaks the join rules, the list keeps the typed values, and "Create league" shows the error.
  - (f) A finished, unknown, or unopened Season shows a notice under the breadcrumbs, and no wizard.
  - (g) `EditTeamDrawer` gets an optional `title` and `note`. The standalone wizard keeps "Edit team for this league".
  - (h) `docs/coding-standards.md` says how a cold-cache store keeps one draft for each container.
- **2026-11-14:** The user agreed the review and the Claude choices (a) to (h). Commit 1. Status Refactor.

## Report

- **What was built:**
  - `design-system/`: a `Breadcrumbs` primitive, and item groups with a tint in `PickerDialog`.
  - `app/state/leagueDraftStore.ts` and `leagueDraftActions.ts`: one draft for each container, and `getLeagueDraft`.
  - `features/components/`: `SeasonTeamDrawer`, `useSeasonTeamEdit`, `findLeagueNames`, and `formatSeasonLabel`, moved from `features/seasons`.
  - `features/leagues/LeagueSetupScreen/`: the `seasonUuid` prop, `useWizardSeason`, `seasonTeams.ts` (the rows of the create, the statuses, the join note), the Season mode of the Teams step and its dialogs, and the create with `createSeasonLeague`.
  - `features/seasons/SeasonViewScreen/`: "+ New league", disabled in a finished Season.
  - `app/`: the route `/seasons/:uuid/leagues/new`.
- **Test approach:** screen tests with Testing Library (`LeagueSetupScreen.season.test.tsx`, 12 cases): the breadcrumbs, the two groups and statuses, the join preview, the roster values, both drawers, the Switch dialog, "Load them all", the create, the separate draft, and the notices. Unit tests for the primitive, the picker groups, and the drafts. One AppShell route test. The standalone wizard tests pass with no change. The full suite passes: 2293 tests. The type check, the lint, and the format check pass.
- **Decisions made:** the eleven choices (Decisions log). The Claude choices (a) to (h) are in the notes.
- **What is left, what is next:** Task 219 adds the league cards, League Detail in a Season, and the route to it after the create. A live check in the app: open a Season, "+ New league", then add teams from both groups.
- **Refactor:** waits for the review.
