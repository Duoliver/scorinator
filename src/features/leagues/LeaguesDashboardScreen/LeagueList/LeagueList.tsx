import type { JSX } from 'preact';
import { Badge, Button, Card } from '@/design-system';
import { leagueDetailPath } from '@/app/routes';
import { describeLeague, formatPointsLabel } from '@/features/leagues/leagueSummary';
import type LeagueListProps from './types';
import styles from './LeagueList.module.css';

export type { LeagueListProps };
export type { LeagueCard } from './types';

/** The Leagues dashboard grid: one card per league, with its meta line,
 * its points pill, and an `Open standings` link to League Detail. A league
 * with unsaved changes (Task 26) carries an `Unsaved` badge beside its name. */
export function LeagueList({ leagues }: LeagueListProps): JSX.Element {
  return (
    <div class={styles.grid}>
      {leagues.map(({ row, isUnsaved }) => (
        <Card key={row.uuid} padding="md">
          <div class={styles.card}>
            <div class={styles.titleRow}>
              <h3 class={styles.title}>{row.name}</h3>
              {isUnsaved && <Badge tone="warning">Unsaved</Badge>}
            </div>
            <span class={styles.meta}>{describeLeague(row)}</span>
            <span class={styles.pointsPill}>{formatPointsLabel(row.points)}</span>
            <Button href={leagueDetailPath(row.uuid)} variant="outline" size="sm">
              Open standings
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
LeagueList.displayName = 'LeagueList';
