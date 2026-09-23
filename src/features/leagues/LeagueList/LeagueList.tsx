import type { JSX } from 'preact';
import { Button, Card } from '@/design-system';
import { leagueDetailPath } from '@/app/routes';
import { describeLeague } from '../leagueSummary';
import type LeagueListProps from './types';
import styles from './LeagueList.module.css';

export type { LeagueListProps };

/** The Leagues dashboard grid: one card per league, with its meta line,
 * its points pill, and an `Open standings` link to League Detail. */
export function LeagueList({ leagues }: LeagueListProps): JSX.Element {
  return (
    <div class={styles.grid}>
      {leagues.map((league) => (
        <Card key={league.slug} padding="md">
          <div class={styles.card}>
            <h3 class={styles.title}>{league.name}</h3>
            <span class={styles.meta}>{describeLeague(league)}</span>
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
  );
}
LeagueList.displayName = 'LeagueList';
