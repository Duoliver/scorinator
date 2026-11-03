import type { JSX } from 'preact';
import { Button, Tooltip } from '@/design-system';
import { TeamSwatch } from '@/features/components';
import type TieCardProps from './types';
import styles from './TieCard.module.css';

export type { TieCardProps };

/**
 * One tie of the tree (US-04.8): two team rows with a score column for
 * each match, the score header (choice 3), and a footer with the aggregate,
 * the decision tag, and the "⚽" button (choice 5). A bye card shows its
 * team and "BYE — advances automatically" (US-04.11). The winner row is
 * bold, with the positive tint (choice 4).
 */
export function TieCard({ card, onScorinate }: TieCardProps): JSX.Element {
  const [top, bottom] = card.rows;
  const label = `${top.name} v ${bottom.name}`;
  const button = (
    <Tooltip
      content={card.hasResult ? 'Scorinate this tie again' : 'Scorinate this tie'}
    >
      {(describedBy) => (
        <Button
          size="icon"
          aria-label={`Scorinate ${label}`}
          aria-describedby={describedBy}
          disabled={!card.canScorinate}
          onClick={() => onScorinate(card.id)}
        >
          ⚽
        </Button>
      )}
    </Tooltip>
  );

  if (card.isBye) {
    return (
      <div role="group" aria-label={label} class={`${styles.card} ${styles.bye}`}>
        <div class={`${styles.row} ${styles.winnerRow}`}>
          <TeamSwatch colour={top.colour} size="sm" />
          <span class={styles.name}>{top.name}</span>
        </div>
        <div class={styles.footer}>
          <span class={styles.byeText}>BYE — advances automatically</span>
          {button}
        </div>
      </div>
    );
  }

  return (
    <div role="group" aria-label={label} class={styles.card}>
      {card.title && <p class={styles.title}>{card.title}</p>}
      {card.columns.length > 0 && (
        <div class={styles.row} aria-hidden="true">
          <span class={styles.name} />
          {card.columns.map((column) => (
            <span key={column} class={styles.head}>
              {column}
            </span>
          ))}
        </div>
      )}
      {card.rows.map((row) => (
        <div
          key={row.key}
          class={`${styles.row} ${row.isWinner ? styles.winnerRow : ''} ${row.isTbd ? styles.tbd : ''}`}
        >
          <TeamSwatch colour={row.colour} size="sm" />
          <span class={styles.name}>{row.name}</span>
          {row.scores.map((score, i) => (
            <span key={i} class={styles.score}>
              {score}
            </span>
          ))}
        </div>
      ))}
      <div class={styles.footer}>
        <span class={styles.footerText}>{card.footer}</span>
        {button}
      </div>
    </div>
  );
}
TieCard.displayName = 'TieCard';
