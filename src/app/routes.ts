/** Every route path in the app, in one place. Import `ROUTES` instead of a
 * literal path string, so a path change is a one-line edit here instead of a
 * find-and-replace across `app/` and `features/`. */
export const ROUTES = {
  root: '/',
  teams: '/teams',
  leaguesNew: '/leagues/new',
  leagueDetail: '/leagues/:slug',
} as const;

export type RoutePath = (typeof ROUTES)[keyof typeof ROUTES];

/** Builds a real, navigable League Detail URL from a league's slug —
 * `ROUTES.leagueDetail` itself is the route pattern `<Router>` matches
 * against, not a path anything should navigate to directly. */
export function leagueDetailPath(slug: string): string {
  return `/leagues/${slug}`;
}
