import type { JSX } from 'preact';
import { Button, Card, ConfirmDialog, Input } from '@/design-system';
import { SeasonDialog } from './SeasonDialog';
import { SeasonList } from './SeasonList';
import { useSeasonsList } from './useSeasonsList';
import styles from './SeasonsListScreen.module.css';

/** The Seasons screen (Task 212): the Season cards, the search, and the
 * create, rename, and delete of a Season. */
export function SeasonsListScreen(): JSX.Element {
  const list = useSeasonsList();

  return (
    <div class={styles.screen}>
      <div class={styles.header}>
        <div>
          <h1 class={styles.title}>Seasons</h1>
          <p class={styles.subtitle}>{list.subtitle}</p>
        </div>
        {list.hasSeasons && (
          <Button variant="primary" size="md" onClick={list.openCreate}>
            + New Season
          </Button>
        )}
      </div>

      {list.hasSeasons ? (
        <>
          <div class={styles.search}>
            <Input
              label="Search"
              placeholder="Name or year"
              defaultValue={list.search}
              onChange={list.setSearch}
            />
          </div>
          {list.noMatchText ? (
            <p class={styles.note}>{list.noMatchText}</p>
          ) : (
            <SeasonList
              cards={list.cards}
              onRename={list.openRename}
              onDelete={list.openDelete}
            />
          )}
        </>
      ) : (
        <Card padding="lg">
          <div class={styles.empty}>
            <h2 class={styles.emptyTitle}>No Seasons yet</h2>
            <p class={styles.note}>A Season groups leagues that share their teams.</p>
            <Button variant="primary" size="md" onClick={list.openCreate}>
              + New Season
            </Button>
          </div>
        </Card>
      )}

      {list.dialog && <SeasonDialog {...list.dialog} />}
      {list.deleteConfirm && <ConfirmDialog {...list.deleteConfirm} />}
    </div>
  );
}
SeasonsListScreen.displayName = 'SeasonsListScreen';
