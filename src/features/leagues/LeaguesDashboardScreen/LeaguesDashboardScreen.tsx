import type { JSX } from 'preact';
import { Button } from '@/design-system';
import { ROUTES } from '@/app/routes';
import { LeagueList } from './LeagueList';
import { LeaguesEmptyState } from './LeaguesEmptyState';
import { useLeaguesDashboard } from './useLeaguesDashboard';
import styles from './LeaguesDashboardScreen.module.css';

/** Lists every league and gives the wizard's real entry point,
 * `+ New League`. A plain `<a href>` is enough for both that link and
 * `LeagueList`'s `Open standings` — any mounted `<Router>` (`AppShell`
 * mounts one) already intercepts a same-origin `<a href>` click globally
 * and routes it client-side, with no `onClick` needed. Reaching for
 * `preact-router`'s `route()` directly, the way `useLeagueSetup`'s
 * `handleCreate` does, is for an *imperative* navigation with no click to
 * intercept — not the case for an ordinary link here.
 *
 * Leagues is the start screen (Task 29). With no leagues, it shows
 * `LeaguesEmptyState` and hides `+ New League`, which would repeat the
 * empty state's Create league. */
export function LeaguesDashboardScreen(): JSX.Element {
  const { leagues, hasLeagues, subtitle } = useLeaguesDashboard();

  return (
    <div class={styles.screen}>
      <div class={styles.header}>
        <div>
          <h1 class={styles.title}>Leagues</h1>
          <p class={styles.subtitle}>{subtitle}</p>
        </div>
        {hasLeagues && (
          <Button href={ROUTES.leaguesNew} variant="primary" size="md">
            + New League
          </Button>
        )}
      </div>

      {hasLeagues ? <LeagueList leagues={leagues} /> : <LeaguesEmptyState />}
    </div>
  );
}
LeaguesDashboardScreen.displayName = 'LeaguesDashboardScreen';
