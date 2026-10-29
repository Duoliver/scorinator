import type { JSX } from 'preact';
import { Router } from 'preact-router';
import { StatusLine } from '@/features/components';
import { ROUTES } from '@/app/routes';
import { NAV_ITEMS, databaseNote, isNavItemActive } from './helpers';
import {
  FileRoute,
  LeagueDetailRoute,
  LeagueSetupRoute,
  LeaguesDashboardRoute,
  TeamsRoute,
} from './routeAdapters';
import { useAppShell } from './useAppShell';
import styles from './AppShell.module.css';

export function AppShell(): JSX.Element {
  const { activePath, databaseStatus, handleRouteChange, handleNavClick } =
    useAppShell();
  const note = databaseNote(databaseStatus);

  return (
    <div class={styles.shell}>
      <nav class={styles.nav}>
        <div class={styles.brand}>Scorinator</div>
        {NAV_ITEMS.map((item) => (
          <a
            key={item.path}
            href={item.path}
            class={styles.navItem}
            aria-current={isNavItemActive(item, activePath) ? 'page' : undefined}
            onClick={handleNavClick(item.path)}
          >
            {item.label}
          </a>
        ))}
        {/* The File screen shows its own status line. */}
        {activePath !== ROUTES.file && <StatusLine placement="sidebar" />}
      </nav>
      <div class={styles.content}>
        {note !== null ? (
          <p
            class={styles.databaseNote}
            role={databaseStatus.kind === 'error' ? 'alert' : 'status'}
          >
            {note}
          </p>
        ) : (
          <Router onChange={handleRouteChange}>
            <TeamsRoute path={ROUTES.teams} />
            <FileRoute path={ROUTES.file} />
            <LeagueSetupRoute path={ROUTES.leaguesNew} />
            <LeaguesDashboardRoute path={ROUTES.leaguesDashboard} default />
            <LeagueDetailRoute path={ROUTES.leagueDetail} />
          </Router>
        )}
      </div>
    </div>
  );
}
AppShell.displayName = 'AppShell';
