import type { JSX } from 'preact';
import { Badge, Button, Card, DropdownMenu } from '@/design-system';
import { seasonDetailPath } from '@/app/routes';
import {
  formatSeasonLabel,
  formatSeasonMeta,
} from '@/features/seasons/SeasonsListScreen/helpers';
import type SeasonListProps from './types';
import styles from './SeasonList.module.css';

export type { SeasonListProps };
export type { SeasonCard } from './types';

/** The Season cards of the Seasons list (US-13.1, demo points 2 and 4). */
export function SeasonList({
  cards,
  onRename,
  onDelete,
}: SeasonListProps): JSX.Element {
  return (
    <div class={styles.grid}>
      {cards.map(({ row, isUnsaved }) => (
        <Card key={row.uuid} padding="md">
          <article class={styles.card} aria-label={formatSeasonLabel(row)}>
            <div class={styles.titleRow}>
              <div class={styles.name}>
                <h3 class={styles.title}>{row.name}</h3>
                <Badge tone="dark">{row.year}</Badge>
                {isUnsaved && <Badge tone="warning">Unsaved</Badge>}
              </div>
              <span class={styles.state}>
                <Badge tone={row.finished ? 'accent' : 'neutral'}>
                  {row.finished ? 'Finished' : 'Running'}
                </Badge>
              </span>
            </div>
            <span class={styles.meta}>{formatSeasonMeta(row)}</span>
            <div class={styles.footer}>
              <Button href={seasonDetailPath(row.uuid)} variant="outline" size="sm">
                Open Season
              </Button>
              <DropdownMenu
                label={`More actions for ${formatSeasonLabel(row)}`}
                icon="⋮"
                items={[
                  { label: 'Rename...', onSelect: () => onRename(row) },
                  { label: 'Delete...', tone: 'danger', onSelect: () => onDelete(row) },
                ]}
              />
            </div>
          </article>
        </Card>
      ))}
    </div>
  );
}
SeasonList.displayName = 'SeasonList';
