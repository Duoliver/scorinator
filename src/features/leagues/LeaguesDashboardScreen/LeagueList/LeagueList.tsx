import type { JSX } from 'preact';
import { Badge, Button, Card } from '@/design-system';
import { leagueDetailPath } from '@/app/routes';
import {
  describeLeague,
  formatPointsLabel,
  formatProgressBadge,
} from '@/features/leagues/leagueSummary';
import type LeagueListProps from './types';
import styles from './LeagueList.module.css';

export type { LeagueListProps };
export type { LeagueCard } from './types';

/** The Leagues dashboard grid: one card per league, with its meta line,
 * its points pill, and an `Open standings` link to League Detail. A league
 * with unsaved changes (Task 26) carries an `Unsaved` badge beside its name.
 * The progress badge is dark during a phase and accent when complete, as in
 * the MVP2 handoff (Task 131 choice 4). The body between the header and the
 * button takes the free space, so the button sits at the bottom edge of a
 * card that a taller neighbour stretches (Task 182). */
export function LeagueList({ leagues }: LeagueListProps): JSX.Element {
  return (
    <div class={styles.grid}>
      {leagues.map(({ row, isUnsaved }) => (
        <Card key={row.uuid} padding="md">
          <div class={styles.card}>
            <div class={styles.titleRow}>
              <div class={styles.name}>
                <h3 class={styles.title}>{row.name}</h3>
                {isUnsaved && <Badge tone="warning">Unsaved</Badge>}
              </div>
              <span class={styles.progress}>
                <Badge tone={row.progress.kind === 'completed' ? 'accent' : 'dark'}>
                  {formatProgressBadge(row.progress)}
                </Badge>
              </span>
            </div>
            <div class={styles.body}>
              <span class={styles.meta}>{describeLeague(row)}</span>
              <span class={styles.pointsPill}>{formatPointsLabel(row.points)}</span>
            </div>
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
