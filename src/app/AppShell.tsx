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
import { useFileStore } from '@/app/state/fileStore';
import { saveCurrentLeague } from '@/app/saveActions';
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

const DEFAULT_PATH = ROUTES.teams;

/** How long a save/load result stays in the status line. */
const STATUS_VISIBLE_MS = 4000;

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
  const status = useFileStore((state) => state.status);

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

  // The status line clears itself. A new status restarts the timer.
  useEffect(() => {
    if (!status) return;
    const timer = setTimeout(() => useFileStore.getState().clearStatus(), STATUS_VISIBLE_MS);
    return (): void => clearTimeout(timer);
  }, [status]);

  const handleChange = (args: RouterOnChangeArgs): void => {
    // `default` on `TeamsRoute` renders it for any unmatched path, including
    // ROUTES.root, but `onChange` still reports the literal browser url —
    // normalize it to the path it actually rendered, so the nav highlight
    // matches.
    setActivePath(args.url === ROUTES.root ? DEFAULT_PATH : args.url);
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
        {status && activePath !== ROUTES.file && (
          <p
            role="status"
            class={`${styles.status} ${status.tone === 'error' ? styles.statusError : ''}`}
          >
            {status.message}
          </p>
        )}
      </nav>
      <div class={styles.content}>
        <Router onChange={handleChange}>
          <TeamsRoute path={ROUTES.teams} default />
          <FileRoute path={ROUTES.file} />
          <LeagueSetupRoute path={ROUTES.leaguesNew} />
          <LeaguesDashboardRoute path={ROUTES.leaguesDashboard} />
          <LeagueDetailRoute path={ROUTES.leagueDetail} />
          {import.meta.env.DEV && <PlaygroundRoute path={ROUTES.playground} />}
        </Router>
      </div>
    </div>
  );
}
