import { ROUTES } from '@/app/routes';
import type { DatabaseStatus } from '@/app/state/databaseStore';
import type { NavItem } from './types';

export const NAV_ITEMS: NavItem[] = [
  { label: 'Leagues', path: ROUTES.leaguesDashboard },
  { label: 'Seasons', path: ROUTES.seasons },
  { label: 'Teams', path: ROUTES.teams },
  { label: 'File', path: ROUTES.file },
];

/** The start screen (Task 29). It also renders for any unmatched path. */
export const DEFAULT_PATH = ROUTES.leaguesDashboard;

/** The nav items with screens below them: League Setup and League Detail
 * below Leagues, a Season view below Seasons (Task 212). Their URLs never
 * match the item path exactly, so the item needs a prefix check. Otherwise
 * it would go dark while the user is still inside its section. */
const PARENT_PATHS: readonly string[] = [ROUTES.leaguesDashboard, ROUTES.seasons];

export function isNavItemActive(item: NavItem, activePath: string): boolean {
  if (activePath === item.path) return true;
  return PARENT_PATHS.includes(item.path) && activePath.startsWith(`${item.path}/`);
}

/** `default` on the dashboard route renders it for any unmatched path,
 * including `ROUTES.root`, but the router `onChange` still reports the
 * literal browser url. This gives the path the router rendered, so the nav
 * highlight matches. */
export function toActivePath(url: string): string {
  return url === ROUTES.root ? DEFAULT_PATH : url;
}

/** True when the router moved to another screen (Task 38). `previous` is
 * undefined on the first render, and the router does not call `onChange`
 * for the current url, so neither case counts. */
export function isScreenChange(previous: string | undefined, url: string): boolean {
  return previous !== undefined && previous !== url;
}

/** The text the content area shows in place of a screen while the database
 * is not open (Task 109). `null` once it is open. */
export function databaseNote(status: DatabaseStatus): string | null {
  if (status.kind === 'open') return null;
  if (status.kind === 'error') return `The database could not open: ${status.message}`;
  return 'Opening the database…';
}
