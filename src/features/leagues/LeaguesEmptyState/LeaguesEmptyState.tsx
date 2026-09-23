import type { JSX } from 'preact';
import { Button, Card } from '@/design-system';
import { ROUTES } from '@/app/routes';
import { importTeamsFile } from '@/app/data/teamsFile';
import { applyLoadedLeague, importTeams, openLeagueFile } from '@/app/fileActions';
import styles from './LeaguesEmptyState.module.css';

/** What the Leagues start screen shows with no leagues (Task 29): the four
 * ways to begin, in a Teams group and a League group. */
export function LeaguesEmptyState(): JSX.Element {
  // With no league open, a loaded league cannot replace one, so this needs
  // no confirm step, unlike the File screen.
  const handleLoadLeague = async (): Promise<void> => {
    const loaded = await openLeagueFile();
    if (loaded !== null) applyLoadedLeague(loaded);
  };

  return (
    <Card padding="lg">
      <div class={styles.empty}>
        <div>
          <h2 class={styles.title}>No leagues yet.</h2>
          <p class={styles.text}>
            A league needs teams. Create or load teams first, or load a saved league.
          </p>
        </div>
        <div class={styles.groups}>
          <div class={styles.group}>
            <h3 class={styles.groupTitle}>Teams</h3>
            <div class={styles.actions}>
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
          <div class={styles.group}>
            <h3 class={styles.groupTitle}>League</h3>
            <div class={styles.actions}>
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
  );
}
LeaguesEmptyState.displayName = 'LeaguesEmptyState';
