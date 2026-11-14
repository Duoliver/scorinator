/** Every route path in the app, in one place. Import `ROUTES` instead of a
 * literal path string, so a path change is a one-line edit here instead of a
 * find-and-replace across `app/` and `features/`. */
export const ROUTES = {
  root: '/',
  teams: '/teams',
  file: '/file',
  leaguesNew: '/leagues/new',
  leagueDetail: '/leagues/:uuid',
  leaguesDashboard: '/leagues',
  seasons: '/seasons',
  seasonDetail: '/seasons/:uuid',
  seasonLeagueNew: '/seasons/:uuid/leagues/new',
  seasonLeagueDetail: '/seasons/:uuid/leagues/:leagueUuid',
} as const;

export type RoutePath = (typeof ROUTES)[keyof typeof ROUTES];

/** Builds a real, navigable League Detail URL from a league's UUID (US-11.1)
 * — `ROUTES.leagueDetail` itself is the route pattern `<Router>` matches
 * against, not a path anything should navigate to directly. */
export function leagueDetailPath(uuid: string): string {
  return `/leagues/${uuid}`;
}

/** Builds a real, navigable Season view URL from a Season's UUID (Task
 * 212), as `leagueDetailPath` does for a league. */
export function seasonDetailPath(uuid: string): string {
  return `/seasons/${uuid}`;
}

/** Builds the URL of the wizard for a new league in a Season (Task 216). */
export function seasonLeagueNewPath(seasonUuid: string): string {
  return `/seasons/${seasonUuid}/leagues/new`;
}

/** Builds the URL of a Season league. A league UUID is unique only in its
 * container (Task 196), so the path holds the Season UUID too (Task 216). */
export function seasonLeagueDetailPath(seasonUuid: string, leagueUuid: string): string {
  return `/seasons/${seasonUuid}/leagues/${leagueUuid}`;
}
