import { useEffect, useState } from 'preact/hooks';
import type { JSX, TargetedMouseEvent } from 'preact';
import {
  Router,
  route,
  type RouterOnChangeArgs,
  type RoutableProps,
} from 'preact-router';
import { TeamsScreen } from '@/features/teams';
import {
  LeagueSetupScreen,
  LeagueDetailScreen,
  LeaguesDashboardScreen,
} from '@/features/leagues';
import { FileScreen } from '@/features/file';
import { PlaygroundScreen } from '@/features/playground';
import { StatusLine } from '@/features/components';
import { saveCurrentLeague } from '@/app/saveActions';
import { installCloseGuard } from '@/app/closeGuard';
import { useStatusAutoClear } from '@/app/useStatusAutoClear';
import { ROUTES, type RoutePath } from './routes';
import styles from './AppShell.module.css';

interface NavItem {
  label: string;
  path: RoutePath;
}

/** Playground is a dev-only diagnostic screen (PROGRESS.md Task 22) — its
 * nav item and route only exist in a dev build, never in a shipped one. */
const NAV_ITEMS: NavItem[] = [
  { label: 'Leagues', path: ROUTES.leaguesDashboard },
  { label: 'Teams', path: ROUTES.teams },
  { label: 'File', path: ROUTES.file },
  ...(import.meta.env.DEV ? [{ label: 'Playground', path: ROUTES.playground }] : []),
];

/** The start screen (Task 29). It also renders for any unmatched path. */
const DEFAULT_PATH = ROUTES.leaguesDashboard;

/** `TeamsScreen`/`LeagueSetupScreen` take no props and stay routing-agnostic,
 * per `module-boundaries.md` — `features/` never needs to know it is routed.
 * These adapters carry the `path`/`default` typing `<Router>` needs instead. */
function TeamsRoute(_props: RoutableProps): JSX.Element {
  return <TeamsScreen />;
}

function LeagueSetupRoute(_props: RoutableProps): JSX.Element {
  return <LeagueSetupScreen />;
}

function LeaguesDashboardRoute(_props: RoutableProps): JSX.Element {
  return <LeaguesDashboardScreen />;
}

function FileRoute(_props: RoutableProps): JSX.Element {
  return <FileScreen />;
}

function PlaygroundRoute(_props: RoutableProps): JSX.Element {
  return <PlaygroundScreen />;
}

/** Unlike the two adapters above, this one does carry a real prop across:
 * `slug`, the one param `preact-router` injects for `ROUTES.leagueDetail`
 * (`/leagues/:slug`) and the one piece of routing information
 * `LeagueDetailScreen` actually needs. */
function LeagueDetailRoute(props: RoutableProps & { slug?: string }): JSX.Element {
  return <LeagueDetailScreen slug={props.slug ?? ''} />;
}

export function AppShell(): JSX.Element {
  const [activePath, setActivePath] = useState<string>(DEFAULT_PATH);

  // Ctrl+S (Cmd+S on macOS) saves the current league, from any screen. A
  // held key still gets its browser default blocked, but saves only once.
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      const isSave =
        (event.ctrlKey || event.metaKey) &&
        !event.shiftKey &&
        !event.altKey &&
        event.key.toLowerCase() === 's';
      if (!isSave) return;
      event.preventDefault();
      if (event.repeat) return;
      void saveCurrentLeague();
    };
    window.addEventListener('keydown', handleKeyDown);
    return (): void => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Closing the window with unsaved changes asks first (Task 28).
  useEffect(() => installCloseGuard(), []);

  // The status line clears itself. A new status restarts the timer.
  useStatusAutoClear();

  const handleChange = (args: RouterOnChangeArgs): void => {
    // `default` on `LeaguesDashboardRoute` renders it for any unmatched
    // path, including ROUTES.root, but `onChange` still reports the literal
    // browser url — normalize it to the path it actually rendered, so the
    // nav highlight matches.
    setActivePath(args.url === ROUTES.root ? DEFAULT_PATH : args.url);
    // A new screen starts at its top (Task 38). `previous` is undefined on
    // the first render, and the router does not call `onChange` for the
    // current url, so neither case scrolls. `onChange` runs during the
    // router render, so the scroll happens before the new screen paints.
    // Not a layout effect on `activePath`: it starts at `DEFAULT_PATH`, so a
    // first load at another path would count as a change.
    if (args.previous !== undefined && args.previous !== args.url) {
      window.scrollTo({ top: 0 });
    }
  };

  const handleNavClick =
    (path: RoutePath) =>
    (event: TargetedMouseEvent<HTMLAnchorElement>): void => {
      event.preventDefault();
      route(path);
    };

  // A League Detail URL (`/leagues/<slug>`) never exact-matches
  // `ROUTES.leaguesNew`, so the `Leagues` nav item needs a prefix check
  // instead — otherwise it would go dark while the user is still, in
  // every real sense, inside the Leagues section.
  const isNavItemActive = (item: (typeof NAV_ITEMS)[number]): boolean =>
    item.path === ROUTES.leaguesDashboard
      ? activePath === ROUTES.leaguesDashboard || activePath.startsWith('/leagues/')
      : activePath === item.path;

  return (
    <div class={styles.shell}>
      <nav class={styles.nav}>
        <div class={styles.brand}>Scorinator</div>
        {NAV_ITEMS.map((item) => (
          <a
            key={item.path}
            href={item.path}
            class={styles.navItem}
            aria-current={isNavItemActive(item) ? 'page' : undefined}
            onClick={handleNavClick(item.path)}
          >
            {item.label}
          </a>
        ))}
        {/* The File screen shows its own status line. */}
        {activePath !== ROUTES.file && <StatusLine placement="sidebar" />}
      </nav>
      <div class={styles.content}>
        <Router onChange={handleChange}>
          <TeamsRoute path={ROUTES.teams} />
          <FileRoute path={ROUTES.file} />
          <LeagueSetupRoute path={ROUTES.leaguesNew} />
          <LeaguesDashboardRoute path={ROUTES.leaguesDashboard} default />
          <LeagueDetailRoute path={ROUTES.leagueDetail} />
          {import.meta.env.DEV && <PlaygroundRoute path={ROUTES.playground} />}
        </Router>
      </div>
    </div>
  );
}
