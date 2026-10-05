import type { JSX } from 'preact';
import { Badge, Button, Card } from '@/design-system';
import { isLeagueUnsaved, useFileStore } from '@/app/state/fileStore';
import { leagueDetailPath } from '@/app/routes';
import { describeLeague } from '../leagueSummary';
import type LeagueListProps from './types';
import styles from './LeagueList.module.css';

export type { LeagueListProps };

/** The Leagues dashboard grid: one card per league, with its meta line,
 * its points pill, and an `Open standings` link to League Detail. A league
 * with unsaved changes (Task 26) carries an `Unsaved` badge beside its name. */
export function LeagueList({ leagues }: LeagueListProps): JSX.Element {
  const savedLeagues = useFileStore((state) => state.savedLeagues);
  return (
    <div class={styles.grid}>
      {leagues.map((league) => (
        <Card key={league.slug} padding="md">
          <div class={styles.card}>
            <div class={styles.titleRow}>
              <h3 class={styles.title}>{league.name}</h3>
              {isLeagueUnsaved(league, savedLeagues) && <Badge tone="warning">Unsaved</Badge>}
            </div>
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
