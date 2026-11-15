import type { JSX } from 'preact';
import { Badge, Breadcrumbs, ConfirmDialog, DropdownMenu, Tabs } from '@/design-system';
import { ROUTES } from '@/app/routes';
import type LeagueDetailScreenProps from './types';
import { useLeagueDetail } from './useLeagueDetail';
import { ZoneDrawer } from './ZoneDrawer';
import styles from './LeagueDetailScreen.module.css';

export type { LeagueDetailScreenProps };

/** One league: its header, its phase tabs, and its views. A Season league
 * shows the breadcrumbs of its Season in place of "← Leagues" (Task 219). */
export function LeagueDetailScreen({
  uuid,
  seasonUuid,
}: LeagueDetailScreenProps): JSX.Element {
  const state = useLeagueDetail(uuid, seasonUuid);
  const backLink =
    seasonUuid === undefined ? (
      <a href={ROUTES.leaguesDashboard} class={styles.backLink}>
        ← Leagues
      </a>
    ) : (
      <a href={ROUTES.seasons} class={styles.backLink}>
        ← Seasons
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
        {detail.crumbs ? <Breadcrumbs items={detail.crumbs} /> : backLink}
        <div class={styles.header}>
          <div>
            <div class={styles.titleRow}>
              <h1 class={styles.title}>{detail.league.content.name}</h1>
              {detail.isUnsaved && <Badge tone="warning">Unsaved</Badge>}
            </div>
            <span class={styles.meta}>{detail.meta}</span>
          </div>
          <div class={styles.headerEnd}>
            <Badge tone={detail.isComplete ? 'accent' : 'dark'}>
              {detail.progress}
            </Badge>
            {detail.exportItems && (
              <DropdownMenu label="Export" align="end" items={detail.exportItems} />
            )}
          </div>
        </div>
      </div>

      {detail.notice && <p class={styles.notice}>{detail.notice}</p>}

      <Tabs
        ref={detail.tabsRef}
        tabs={detail.tabs}
        defaultTab={detail.defaultTab}
        actions={detail.tabsActions}
      />

      {detail.startConfirm && (
        <ConfirmDialog
          title={detail.startConfirm.title}
          message={detail.startConfirm.message}
          confirmLabel={detail.startConfirm.confirmLabel}
          onConfirm={detail.startConfirm.onConfirm}
          onCancel={detail.startConfirm.onCancel}
        />
      )}
      {detail.zoneDrawer && (
        <ZoneDrawer
          title={detail.zoneDrawer.title}
          plan={detail.zoneDrawer.plan}
          onSave={detail.zoneDrawer.onSave}
          onCancel={detail.zoneDrawer.onCancel}
        />
      )}
    </div>
  );
}
LeagueDetailScreen.displayName = 'LeagueDetailScreen';
