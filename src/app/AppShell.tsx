import { useState } from 'preact/hooks';
import type { JSX, TargetedMouseEvent } from 'preact';
import {
  Router,
  route,
  type RouterOnChangeArgs,
  type RoutableProps,
} from 'preact-router';
import { TeamsScreen } from '@/features/teams';
import { LeagueSetupScreen } from '@/features/leagues';
import { ROUTES, type RoutePath } from './routes';
import styles from './AppShell.module.css';

const NAV_ITEMS = [
  { label: 'Leagues', path: ROUTES.leaguesNew },
  { label: 'Teams', path: ROUTES.teams },
] as const;

const DEFAULT_PATH = ROUTES.teams;

/** `TeamsScreen`/`LeagueSetupScreen` take no props and stay routing-agnostic,
 * per `module-boundaries.md` — `features/` never needs to know it is routed.
 * These adapters carry the `path`/`default` typing `<Router>` needs instead. */
function TeamsRoute(_props: RoutableProps): JSX.Element {
  return <TeamsScreen />;
}

function LeagueSetupRoute(_props: RoutableProps): JSX.Element {
  return <LeagueSetupScreen />;
}

export function AppShell(): JSX.Element {
  const [activePath, setActivePath] = useState<string>(DEFAULT_PATH);

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

  return (
    <div class={styles.shell}>
      <nav class={styles.nav}>
        <div class={styles.brand}>Scorinator</div>
        {NAV_ITEMS.map((item) => (
          <a
            key={item.path}
            href={item.path}
            class={styles.navItem}
            aria-current={activePath === item.path ? 'page' : undefined}
            onClick={handleNavClick(item.path)}
          >
            {item.label}
          </a>
        ))}
      </nav>
      <div class={styles.content}>
        <Router onChange={handleChange}>
          <TeamsRoute path={ROUTES.teams} default />
          <LeagueSetupRoute path={ROUTES.leaguesNew} />
        </Router>
      </div>
    </div>
  );
}
