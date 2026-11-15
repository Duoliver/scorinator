# Task 216: Season leagues in the store

**Status:** Done

## Goal

Give `app/state` the leagues of a Season: create a league in a Season, play it with the league actions of MVP2, and keep the Season teams shared by every league. A finished Season stays read only. Add the routes of a Season league. Tasks 218 and 219 build the screens on it (Task 205, M2).

## Acceptance criteria

- [x] The user creates a league in an open, running Season. It is a full MVP2 league: every phase format, with the checks of `createLeague` (US-13.5).
- [x] The league teams are Season teams. A Blueprint that is not in the roster joins it at the create, with the OVR and Tier of the wizard, and the name and trigram rules of Task 208 (US-13.5, US-13.4).
- [x] Each league action of MVP2 works on a Season league: scorinate, re-scorinate, the next phase, the groups, the bracket, the byes, the zones.
- [x] A Season league plays with the current Season team: an edit of the OVR or the Tier reaches every league (US-13.5).
- [x] Two Season leagues run in parallel, and share teams. A result in one league never changes the other (US-13.6).
- [x] Each action on a Season league throws for a finished Season, and changes nothing (US-13.9).
- [x] A change to a Season league makes the Season unsaved. A save writes the Season file.
- [x] The routes of a new Season league and of a Season league, with their path builders.
- [x] Store tests written first (`docs/tdd.md`). The full suite, the type check, the lint, and the format check pass.

## Notes

- **2026-11-14:** Started. Inputs: US-13.5, US-13.6, US-13.9, the Task 215 demo (round 7: a joining team rolls its OVR at the add), `app/state/leagueWrapperActions.ts` (every action finds a league in `state.leagues` by UUID), `app/state/seasonActions.ts` (`addSeasonTeams`, the Task 208 rules), `domain/season.ts` (`SeasonLeague.teamUuids`), `app/routes.ts`. A league UUID is unique only in its container (Task 196), so a Season league needs the Season UUID in its address. Eight choices sent to the user.
- **2026-11-14:** The user agreed the eight choices: (1) a `LeagueRef`, a standalone UUID or `{ seasonUuid, leagueUuid }`, for every league action. (2) Season leagues stay in the Season wrapper. (3) `findLeagueWrapper` gives a Season league as a cached league wrapper view. (4) A change goes back into the Season, with the stamp on both, and never the view teams. (5) `createSeasonLeague` with the join of Task 208. (6) `requireRunningSeason` on each Season league action. (7) Parallel play needs no code, only tests. (8) The routes and path builders now, the Router entries and breadcrumbs with Tasks 218 and 219.
- **2026-11-14:** Tests first: 29 new cases failed (no module), then passed after the build.
- **2026-11-14:** Claude choices in the code, for the review:
  - (a) `LeagueRef`, `SeasonLeagueRef`, `findLeagueWrapper`, and `toSeasonLeagueView` live in `databaseStore.ts`, with the other pure read helpers.
  - (b) The shared create code moved to a new `newLeague.ts`: `buildLeagueContent`, `checkTeamList`, `startedPhase`, and `CreateLeagueInput`. `createLeague` works as before.
  - (c) The join rules of `addSeasonTeams` moved to a new pure `seasonRoster.ts` (`joinSeasonRoster`), so both actions use one copy.
  - (d) A joining OVR outside its Tier throws. The drawer keeps it in the range, so this is a guard.
  - (e) A Blueprint deleted during the setup still joins, with no Location and no trigram list, as in a standalone league (US-09.4).
  - (f) A trigram fixed for a Season team in the wizard does not count: a Season team changes with `updateSeasonTeam` only.
  - (g) The view cache keys on the league object and the roster array. A change to another league keeps the view.
  - (h) The message for an unknown Season league names the Season and the league.
- **2026-11-14:** The user agreed the review and the Claude choices (a) to (h). Commit 1. Status Refactor.
- **2026-11-14:** Refactor pass, against the review checklist. Three changes, no change in behavior: `toSeasonLeagueView` is now `getSeasonLeagueView` (a function name starts with a verb). The comments of `LeagueRef` and `buildLeagueContent` say why, and no longer name their callers. A search finds the old name only in this task file, in the notes of commit 1. No gap outside the diff, no bug. Waits for the refactor review.
- **2026-11-14:** The user agreed the refactor review. Done.

## Report

- **What was built:**
  - `app/state/databaseStore.ts`: `LeagueRef`, `SeasonLeagueRef`, `findLeagueWrapper`, `getSeasonLeagueView`.
  - `app/state/leagueWrapperActions.ts`: every league action takes a `LeagueRef`. One read seam (`requireLeague`, with the finished guard) and one write seam (`storeLeague`) serve both kinds of league.
  - `app/state/seasonLeagueActions.ts`: `createSeasonLeague`.
  - `app/state/newLeague.ts` and `app/state/seasonRoster.ts`: the shared create code and the join rules.
  - `app/routes.ts`: `ROUTES.seasonLeagueNew`, `ROUTES.seasonLeagueDetail`, `seasonLeagueNewPath`, `seasonLeagueDetailPath`.
- **Test approach:** store tests on the in-memory folder (`seasonLeagueActions.test.ts`, 27 cases): the view, the create and the join, the actions on a Season league, parallel play, the finished guard, and the save. Unit tests for the route builders (2 cases). The earlier league and Season tests pass unchanged. The full suite passes: 2247 tests. The type check, the lint, and the format check pass.
- **Decisions made:** the eight choices (Decisions log). The Claude choices (a) to (h) are in the notes.
- **What is left, what is next:** the screens call the actions with a plain UUID today. Task 218 calls `createSeasonLeague` from the wizard, and Task 219 opens League Detail with a `LeagueRef`, adds the Router entries, and the breadcrumbs. Task 217 adds the playoffs.
- **Refactor:** one rename (`toSeasonLeagueView` to `getSeasonLeagueView`) and two comments. No change in behavior. The checks pass again: 2247 tests.
