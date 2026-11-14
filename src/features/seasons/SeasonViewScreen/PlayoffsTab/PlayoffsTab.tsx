import type { JSX } from 'preact';
import { Button } from '@/design-system';
import { TeamName, TeamSwatch } from '@/features/components';
import type PlayoffsTabProps from './types';
import type { PlayoffRow, PlayoffSide } from './types';
import styles from './PlayoffsTab.module.css';

export type { PlayoffsTabProps };

const PLAYED = '✓ Played';

/** One team of a row: the stacked row puts the swatch first and the goals
 * last on both lines, as the fixtures row does (Task 215 round 2). The
 * name shows its Location in a hint, and a cut name shows the name too
 * (Task 180). */
function Side({ side, end }: { side: PlayoffSide; end: 'one' | 'two' }): JSX.Element {
  return (
    <span
      class={`${styles.side} ${styles[end]}`}
      data-lost={side.isLoser ? '' : undefined}
    >
      <span class={styles.name}>
        <TeamName name={side.name} location={side.location} />
      </span>
      <span class={styles.trigram}>{side.trigram}</span>
      <TeamSwatch colour={side.colour} size="sm" class={styles.swatch} />
      <span class={styles.goals} aria-hidden="true">
        {side.goals}
      </span>
    </span>
  );
}

function Row({
  row,
  isFinished,
}: {
  row: PlayoffRow;
  isFinished: boolean;
}): JSX.Element {
  return (
    <article class={styles.playoff} aria-label={row.name}>
      <div class={styles.head}>
        <div class={styles.headText}>
          <h3 class={styles.title}>{row.name}</h3>
          <span class={styles.rules}>{row.rules}</span>
        </div>
        {!row.play && (
          // The narrow head shows the check mark alone (Task 215 round 4).
          <span class={styles.headStatus} role="img" aria-label="Played">
            ✓
          </span>
        )}
      </div>
      <div class={styles.match}>
        <Side side={row.team1} end="one" />
        <span class={styles.middle}>
          {row.total ? (
            <span class={styles.score}>{row.total}</span>
          ) : (
            <span class={styles.versus}>vs</span>
          )}
        </span>
        <Side side={row.team2} end="two" />
        {row.detail && <span class={styles.detail}>{row.detail}</span>}
        <span class={styles.end}>
          {row.play ? (
            <Button size="sm" disabled={isFinished} onClick={row.play}>
              Play
            </Button>
          ) : (
            <span class={styles.played}>{PLAYED}</span>
          )}
        </span>
      </div>
    </article>
  );
}

/** The Playoffs tab of a Season (US-13.7, Task 220): one row for each
 * playoff, in the order of creation. */
export function PlayoffsTab({
  rows,
  isFinished,
  hasAetKey,
}: PlayoffsTabProps): JSX.Element {
  if (rows.length === 0) return <p class={styles.empty}>No playoffs yet.</p>;
  return (
    <div class={styles.list}>
      {rows.map((row) => (
        <Row key={row.uuid} row={row} isFinished={isFinished} />
      ))}
      {hasAetKey && <p class={styles.key}>* after extra time</p>}
    </div>
  );
}
PlayoffsTab.displayName = 'PlayoffsTab';
