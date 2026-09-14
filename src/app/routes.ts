/** Every route path in the app, in one place. Import `ROUTES` instead of a
 * literal path string, so a path change is a one-line edit here instead of a
 * find-and-replace across `app/` and `features/`. */
export const ROUTES = {
  root: '/',
  teams: '/teams',
  leaguesNew: '/leagues/new',
} as const;

export type RoutePath = (typeof ROUTES)[keyof typeof ROUTES];
