import type { JSX } from 'preact';
import { Badge, Button, ConfirmDialog, PickerDialog, Tabs } from '@/design-system';
import { ROUTES } from '@/app/routes';
import {
  FINISHED_SEASON_NOTICE,
  LeagueList,
  SeasonTeamDrawer,
} from '@/features/components';
import { PlayoffDialog } from './PlayoffDialog';
import { PlayoffsTab } from './PlayoffsTab';
import { TeamsTab } from './TeamsTab';
import type SeasonViewScreenProps from './types';
import type { SeasonTab } from './types';
import { useSeasonView } from './useSeasonView';
import styles from './SeasonViewScreen.module.css';

export type { SeasonViewScreenProps };

/** The view of one Season (US-13.3): its header, its leagues, and its Teams
 * tab. Task 220 adds the Playoffs tab, and Task 221 the Resume tab. */
export function SeasonViewScreen({ uuid }: SeasonViewScreenProps): JSX.Element {
  const state = useSeasonView(uuid);
  const backLink = (
    <a href={ROUTES.seasons} class={styles.backLink}>
      ← Seasons
    </a>
  );

  if (state.kind !== 'open') {
    return (
      <div class={styles.screen}>
        {backLink}
        {state.kind === 'not-found' && <p>Season not found.</p>}
        {state.kind === 'opening' && <p role="status">Opening the Season…</p>}
        {state.kind === 'error' && (
          <p role="alert">The Season could not open: {state.message}</p>
        )}
      </div>
    );
  }

  const { view } = state;
  return (
    <div class={styles.screen}>
      <div>
        {backLink}
        <div class={styles.header}>
          <div>
            <div class={styles.titleRow}>
              <h1 class={styles.title}>{view.name}</h1>
              <Badge tone="dark">{view.year}</Badge>
              {view.isUnsaved && <Badge tone="warning">Unsaved</Badge>}
            </div>
            <span class={styles.meta}>{view.meta}</span>
          </div>
          <div class={styles.headerEnd}>
            <Badge tone={view.isFinished ? 'accent' : 'neutral'}>
              {view.isFinished ? 'Finished' : 'Running'}
            </Badge>
            <Button variant="secondary" size="sm" onClick={view.toggleFinished}>
              {view.isFinished ? 'Reopen Season' : 'Finish Season'}
            </Button>
          </div>
        </div>
      </div>

      {view.isFinished && <p class={styles.notice}>{FINISHED_SEASON_NOTICE}</p>}

      <section class={styles.section} aria-labelledby="season-leagues">
        <div class={styles.sectionHead}>
          <h2 id="season-leagues">Leagues</h2>
          {/* A finished Season is read only (US-13.9): a link cannot be
              disabled, so it is a disabled button. */}
          {view.isFinished ? (
            <Button size="sm" disabled>
              + New league
            </Button>
          ) : (
            <Button href={view.newLeaguePath} size="sm">
              + New league
            </Button>
          )}
        </div>
        {view.leagueCards.length > 0 ? (
          <LeagueList leagues={view.leagueCards} />
        ) : (
          <p class={styles.note}>No leagues yet.</p>
        )}
      </section>

      <Tabs
        tabs={[
          {
            id: 'teams',
            label: 'Teams',
            content: (
              <TeamsTab
                rows={view.rosterRows}
                isFinished={view.isFinished}
                onEdit={view.openDrawer}
              />
            ),
          },
          {
            id: 'playoffs',
            label: 'Playoffs',
            content: (
              <PlayoffsTab
                rows={view.playoffRows}
                isFinished={view.isFinished}
                hasAetKey={view.hasAetKey}
              />
            ),
          },
        ]}
        defaultTab={view.activeTab}
        onChange={(id) => view.setActiveTab(id as SeasonTab)}
        actions={
          view.activeTab === 'teams' ? (
            <Button
              size="sm"
              variant="secondary"
              disabled={view.isFinished}
              onClick={view.openPicker}
            >
              + Add teams
            </Button>
          ) : (
            <Button
              size="sm"
              variant="secondary"
              disabled={view.isFinished}
              onClick={view.openPlayoffDialog}
            >
              + New playoff
            </Button>
          )
        }
      />

      {view.finishConfirm && <ConfirmDialog {...view.finishConfirm} />}
      {view.picker && <PickerDialog {...view.picker} />}
      {view.drawer && <SeasonTeamDrawer {...view.drawer} />}
      {view.playoffDialog && <PlayoffDialog {...view.playoffDialog} />}
    </div>
  );
}
SeasonViewScreen.displayName = 'SeasonViewScreen';
