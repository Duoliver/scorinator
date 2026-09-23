import type { JSX } from 'preact';
import { Button, Card } from '@/design-system';
import { useLeagueStore } from '@/app/state/leagueStore';
import { ROUTES, leagueDetailPath } from '@/app/routes';
import { importTeamsFile } from '@/app/data/teamsFile';
import { applyLoadedLeague, importTeams, openLeagueFile } from '@/app/fileActions';
import { describeLeague } from './leagueSummary';
import styles from './LeaguesDashboardScreen.module.css';

/** Lists every league and gives the wizard's real entry point,
 * `+ New League`. A plain `<a href>` is enough for both that link and
 * each card's `Open standings` — any mounted `<Router>` (`AppShell`
 * mounts one) already intercepts a same-origin `<a href>` click globally
 * and routes it client-side, with no `onClick` needed. Reaching for
 * `preact-router`'s `route()` directly, the way `LeagueSetupScreen`'s
 * `handleCreate` does, is for an *imperative* navigation with no click to
 * intercept — not the case for an ordinary link here.
 *
 * Leagues is the start screen (Task 29). With no leagues, it shows the
 * four ways to begin: create or load teams, and create or load a league,
 * and hides `+ New League`, which would repeat Create league. */
export function LeaguesDashboardScreen(): JSX.Element {
  const leagues = useLeagueStore((state) => state.leagues);

  // With no league open, a loaded league cannot replace one, so this needs
  // no confirm step, unlike the File screen.
  const handleLoadLeague = async (): Promise<void> => {
    const loaded = await openLeagueFile();
    if (loaded !== null) applyLoadedLeague(loaded);
  };

  return (
    <div class={styles.screen}>
      <div class={styles.header}>
        <div>
          <h1 class={styles.title}>Leagues</h1>
          <p class={styles.subtitle}>
            {leagues.length} league{leagues.length === 1 ? '' : 's'} running
          </p>
        </div>
        {leagues.length > 0 && (
          <Button href={ROUTES.leaguesNew} variant="primary" size="md">
            + New League
          </Button>
        )}
      </div>

      {leagues.length === 0 ? (
        <Card padding="lg">
          <div class={styles.empty}>
            <div>
              <h2 class={styles.emptyTitle}>No leagues yet.</h2>
              <p class={styles.emptyText}>
                A league needs teams. Create or load teams first, or load a saved
                league.
              </p>
            </div>
            <div class={styles.emptyGroups}>
              <div class={styles.emptyGroup}>
                <h3 class={styles.emptyGroupTitle}>Teams</h3>
                <div class={styles.emptyActions}>
                  <Button href={ROUTES.teams} variant="primary" size="md">
                    Create teams
                  </Button>
                  <Button
                    variant="secondary"
                    size="md"
                    onClick={() => void importTeams(() => importTeamsFile())}
                  >
                    Load teams...
                  </Button>
                </div>
              </div>
              <div class={styles.emptyGroup}>
                <h3 class={styles.emptyGroupTitle}>League</h3>
                <div class={styles.emptyActions}>
                  <Button href={ROUTES.leaguesNew} variant="primary" size="md">
                    Create league
                  </Button>
                  <Button
                    variant="secondary"
                    size="md"
                    onClick={() => void handleLoadLeague()}
                  >
                    Load league...
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Card>
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
                <Button
                  href={leagueDetailPath(league.slug)}
                  variant="outline"
                  size="sm"
                >
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
