import { useEffect, useState } from 'preact/hooks';
import { route, type RouterOnChangeArgs } from 'preact-router';
import type { TargetedMouseEvent } from 'preact';
import { installCloseGuard } from '@/app/closeGuard';
import type { RoutePath } from '@/app/routes';
import { useStatusAutoClear } from '@/app/useStatusAutoClear';
import { DEFAULT_PATH, isScreenChange, toActivePath } from './helpers';
import type { AppShellState } from './types';
import { useSaveShortcut } from './useSaveShortcut';

/** The app-wide behaviour that lives as long as the window: Ctrl+S, the
 * close guard, the status line timer, and the route state of the nav. */
export function useAppShell(): AppShellState {
  const [activePath, setActivePath] = useState<string>(DEFAULT_PATH);

  useSaveShortcut();

  // Closing the window with unsaved changes asks first (Task 28).
  useEffect(() => installCloseGuard(), []);

  // The status line clears itself. A new status restarts the timer.
  useStatusAutoClear();

  const handleRouteChange = (args: RouterOnChangeArgs): void => {
    setActivePath(toActivePath(args.url));
    // A new screen starts at its top (Task 38). `onChange` runs during the
    // router render, so the scroll happens before the new screen paints.
    // Not a layout effect on `activePath`: it starts at `DEFAULT_PATH`, so a
    // first load at another path would count as a change.
    if (isScreenChange(args.previous, args.url)) {
      window.scrollTo({ top: 0 });
    }
  };

  const handleNavClick =
    (path: RoutePath) =>
    (event: TargetedMouseEvent<HTMLAnchorElement>): void => {
      event.preventDefault();
      route(path);
    };

  return { activePath, handleRouteChange, handleNavClick };
}
