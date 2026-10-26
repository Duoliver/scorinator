import type { TargetedMouseEvent } from 'preact';
import type { RouterOnChangeArgs } from 'preact-router';
import type { RoutePath } from '@/app/routes';

export interface NavItem {
  label: string;
  path: RoutePath;
}

/** What `useAppShell` gives `AppShell`. */
export interface AppShellState {
  /** The path of the screen on show, for the nav highlight. */
  activePath: string;
  handleRouteChange: (args: RouterOnChangeArgs) => void;
  handleNavClick: (
    path: RoutePath
  ) => (event: TargetedMouseEvent<HTMLAnchorElement>) => void;
}
