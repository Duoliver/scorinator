import type { JSX } from 'preact';
import { Badge, Tabs } from '@/design-system';
import { ROUTES } from '@/app/routes';
import type LeagueDetailScreenProps from './types';
import { useLeagueDetail } from './useLeagueDetail';
import styles from './LeagueDetailScreen.module.css';

export type { LeagueDetailScreenProps };

export function LeagueDetailScreen({ slug }: LeagueDetailScreenProps): JSX.Element {
  const detail = useLeagueDetail(slug);

  if (!detail) {
    return (
      <div class={styles.screen}>
        <a href={ROUTES.leaguesDashboard} class={styles.backLink}>
          ← Leagues
        </a>
        <p>League not found.</p>
      </div>
    );
  }

  return (
    <div class={styles.screen}>
      <div>
        <a href={ROUTES.leaguesDashboard} class={styles.backLink}>
          ← Leagues
        </a>
        <div class={styles.titleRow}>
          <h1 class={styles.title}>{detail.league.name}</h1>
          {detail.isUnsaved && <Badge tone="warning">Unsaved</Badge>}
        </div>
        <span class={styles.meta}>{detail.meta}</span>
      </div>

      <Tabs tabs={detail.tabs} defaultTab="standings" />
    </div>
  );
}
LeagueDetailScreen.displayName = 'LeagueDetailScreen';
