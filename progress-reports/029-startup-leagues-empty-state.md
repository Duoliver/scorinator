# Task 29 — Startup: Leagues first, with an empty state

## What was done

- Leagues is the start screen. `AppShell` now uses `ROUTES.leaguesDashboard` as `DEFAULT_PATH`, and `LeaguesDashboardRoute` is the `default` route. So `/` and any unknown path show Leagues.
- With no leagues, the Leagues dashboard shows one card with two groups:
  - **Teams:** "Create teams" links to the Teams screen. "Load teams..." opens one file dialog for `.csv` or `.json`.
  - **League:** "Create league" links to the League Setup wizard. "Load league..." opens a league save file.
- The "+ New League" header button stays.
- New `app/data/teamsFile.ts` (`importTeamsFile`): one dialog with a `csv`/`json` filter. It picks the parser by the file extension, in any letter case. It rejects any other extension before it reads the file, because some platforms let the user pick any file.
- New `app/fileActions.ts`: `openLeagueFile`, `isLeagueOpen`, `applyLoadedLeague`, and `importTeams`. The File screen and the Leagues empty state share them, the same way `saveActions.ts` shares save. The File screen code moved there with no change in behavior.
- `importMerge.ts` and its test moved from `features/file/` to `app/data/`, because `app/fileActions.ts` needs them and `features/leagues` must not import from the `features/file` screen folder.

## Tests

- `teamsFile.test.ts`: cancel, the dialog filter, CSV, JSON with an upper-case extension, and a bad extension.
- `fileActions.test.ts`: load, cancel, a bad file, the open-league check, apply, and team import (merge, cancel, error).
- `LeaguesDashboardScreen.test.tsx`: the two links, Load teams, Load league (the league card then shows), and no empty state when a league exists.
- `AppShell.test.tsx`: the start screen is Leagues, and the nav goes to Teams and back.
- The suite went from 407 to 424 tests. `lint` and `type-check` show no errors.

## Decisions made

- Load teams uses one dialog for both formats. The user chose this. The File screen keeps its separate Import CSV and Import JSON buttons.
- Load league on the empty state has no replace confirm, because no league is open to replace.
- After a load, the app stays on Leagues. The new league card shows at once.

**Not verified:** a real click-through of the dialogs. The sandbox has no display. To check it, run `npm run tauri:dev`, then use each of the four buttons on a fresh start.
- The "+ New League" button hides while the empty state shows, because the empty state has its own Create league button. The user asked for this. `AppShell.test.tsx` now reaches League Setup through Create league.
- For readability, the empty state and the league grid moved out of `LeaguesDashboardScreen` into their own components, `LeaguesEmptyState/` and `LeagueList/`. Each has its own stylesheet, in the `FileCard` folder layout. The user asked for this. The screen tests cover both components, so they have no separate test files.
