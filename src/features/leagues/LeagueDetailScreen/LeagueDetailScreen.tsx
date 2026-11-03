import type { JSX } from 'preact';
import { Badge, ConfirmDialog, Tabs } from '@/design-system';
import { ROUTES } from '@/app/routes';
import type LeagueDetailScreenProps from './types';
import { useLeagueDetail } from './useLeagueDetail';
import styles from './LeagueDetailScreen.module.css';

export type { LeagueDetailScreenProps };

export function LeagueDetailScreen({ uuid }: LeagueDetailScreenProps): JSX.Element {
  const state = useLeagueDetail(uuid);
  const backLink = (
    <a href={ROUTES.leaguesDashboard} class={styles.backLink}>
      ← Leagues
    </a>
  );

  if (state.kind !== 'open') {
    return (
      <div class={styles.screen}>
        {backLink}
        {state.kind === 'not-found' && <p>League not found.</p>}
        {state.kind === 'opening' && <p role="status">Opening the league…</p>}
        {state.kind === 'error' && (
          <p role="alert">The league could not open: {state.message}</p>
        )}
      </div>
    );
  }

  const { detail } = state;
  return (
    <div class={styles.screen}>
      <div>
        {backLink}
        <div class={styles.header}>
          <div>
            <div class={styles.titleRow}>
              <h1 class={styles.title}>{detail.league.content.name}</h1>
              {detail.isUnsaved && <Badge tone="warning">Unsaved</Badge>}
            </div>
            <span class={styles.meta}>{detail.meta}</span>
          </div>
          <Badge tone={detail.isComplete ? 'accent' : 'dark'}>{detail.progress}</Badge>
        </div>
      </div>

      <Tabs ref={detail.tabsRef} tabs={detail.tabs} defaultTab={detail.defaultTab} />

      {detail.startConfirm && (
        <ConfirmDialog
          title={detail.startConfirm.title}
          message={detail.startConfirm.message}
          confirmLabel={detail.startConfirm.confirmLabel}
          onConfirm={detail.startConfirm.onConfirm}
          onCancel={detail.startConfirm.onCancel}
        />
      )}
    </div>
  );
}
LeagueDetailScreen.displayName = 'LeagueDetailScreen';
