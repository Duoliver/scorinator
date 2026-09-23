import type { JSX } from 'preact';
import { Button, Card } from '@/design-system';
import { useLeagueStore } from '@/app/state/leagueStore';
import { ROUTES, leagueDetailPath } from '@/app/routes';
import { describeLeague } from './leagueSummary';
import styles from './LeaguesDashboardScreen.module.css';

/** Lists every league and gives the wizard's real entry point,
 * `+ New League`. A plain `<a href>` is enough for both that link and
 * each card's `Open standings` — any mounted `<Router>` (`AppShell`
 * mounts one) already intercepts a same-origin `<a href>` click globally
 * and routes it client-side, with no `onClick` needed. Reaching for
 * `preact-router`'s `route()` directly, the way `LeagueSetupScreen`'s
 * `handleCreate` does, is for an *imperative* navigation with no click to
 * intercept — not the case for an ordinary link here. */
export function LeaguesDashboardScreen(): JSX.Element {
  const leagues = useLeagueStore((state) => state.leagues);

  return (
    <div class={styles.screen}>
      <div class={styles.header}>
        <div>
          <h1 class={styles.title}>Leagues</h1>
          <p class={styles.subtitle}>
            {leagues.length} league{leagues.length === 1 ? '' : 's'} running
          </p>
        </div>
        <Button href={ROUTES.leaguesNew} variant="primary" size="md">
          + New League
        </Button>
      </div>

      {leagues.length === 0 ? (
        <p class={styles.empty}>No leagues yet.</p>
      ) : (
        <div class={styles.grid}>
          {leagues.map((league) => (
            <Card key={league.slug} padding="md">
              <div class={styles.card}>
                <h3 class={styles.cardTitle}>{league.name}</h3>
                <span class={styles.cardMeta}>{describeLeague(league)}</span>
                <span class={styles.pointsPill}>
                  {league.points.win}/{league.points.draw}/{league.points.loss} pts
                </span>
                <Button href={leagueDetailPath(league.slug)} variant="outline" size="sm">
                  Open standings
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
LeaguesDashboardScreen.displayName = 'LeaguesDashboardScreen';
