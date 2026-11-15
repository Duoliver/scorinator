# Task 256: the Seasons module as the main screen

**Status:** Done

## Goal

The app starts on the Leagues dashboard today (Task 29): `/` and any unknown path show it, and "Leagues" is the first sidebar item. Make the Seasons module the main screen instead. A layout tweak, before M3 starts.

## Acceptance criteria

The user agreed the criteria and the three default choices on 2026-11-15: (1) the sidebar order Seasons, Leagues, Teams, File. (2) The Seasons list after the database opens. (3) The "Leagues" label stays.

- [x] The app opens on the Seasons list. `/` and any unknown path show it, with "Seasons" marked active in the sidebar.
- [x] The sidebar order is Seasons, Leagues, Teams, File (choice 1).
- [x] The Leagues dashboard stays at `/leagues`, with its standalone leagues.
- [x] The AppShell tests and the smoke tests that start on the Leagues dashboard change to the new start screen. The full suite, the type check, the lint, and the format check pass.

## Notes

- **2026-11-15:** Task created by the user. A layout tweak before M3. It changes the Task 29 start screen. Draft criteria and three choices wait for the user.
- **2026-11-15:** The user agreed the criteria and the default choices. Started.
- **2026-11-15:** Tests first: the start screen, the nav order, and the root path, failed. Then they passed. The eight smoke cases failed at their first step, as expected: each one waited for the Leagues dashboard. Each case now waits for "No Seasons yet", and each new session opens at `/leagues`, where the case checks its league. Two AppShell tests of the loading state now check the Seasons heading. The comment of `LeaguesDashboardScreen` no longer calls it the start screen.
- **2026-11-15:** The user agreed the review. Commit 1. The refactor pass is next.
- **2026-11-15:** The refactor pass read the diff against the review checklist. No change. No gap outside the diff, and no bug found.
- **2026-11-15:** The user agreed the refactor review. Done. Commit 2.

## Report

- **What was built:** the app opens on the Seasons list, for `/` and any unknown path, with "Seasons" active. The sidebar order is Seasons, Leagues, Teams, File. The Leagues dashboard stays at `/leagues`.
- **Test approach:** three changed AppShell tests (the start screen, the nav order, the root path), two loading-state tests, and the eight smoke cases. The full suite passes: 2336 tests. The type check, the lint, and the format check pass.
- **Decisions made:** the start screen of Task 29 changes (Decisions log).
- **What is left, what is next:** a live check: start the app. Then the next layout tweak of the user, or M3.
- **Refactor:** no change. The diff follows the checklist: the new comments say why, the names stay, and a search for "start screen" finds no stale text in `src/` or the live docs.
