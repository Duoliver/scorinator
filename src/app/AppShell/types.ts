import type { TargetedMouseEvent } from 'preact';
import type { RouterOnChangeArgs } from 'preact-router';
import type { RoutePath } from '@/app/routes';
import type { DatabaseStatus } from '@/app/state/databaseStore';

export interface NavItem {
  label: string;
  path: RoutePath;
}

/** What `useAppShell` gives `AppShell`. */
export interface AppShellState {
  /** The path of the screen on show, for the nav highlight. */
  activePath: string;
  /** No screen shows until the database is open (Task 109). */
  databaseStatus: DatabaseStatus;
  handleRouteChange: (args: RouterOnChangeArgs) => void;
  handleNavClick: (
    path: RoutePath
  ) => (event: TargetedMouseEvent<HTMLAnchorElement>) => void;
}
