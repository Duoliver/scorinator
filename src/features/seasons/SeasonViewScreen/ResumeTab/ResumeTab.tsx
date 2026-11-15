import type { JSX } from 'preact';
import { Badge } from '@/design-system';
import { TeamName } from '@/features/components';
import type ResumeTabProps from './types';
import type { ResumeCard } from './types';
import styles from './ResumeTab.module.css';

export type { ResumeTabProps };

function Card({ card }: { card: ResumeCard }): JSX.Element {
  return (
    <a class={styles.card} href={card.href}>
      <div class={styles.head}>
        <h3 class={styles.title}>{card.name}</h3>
        <Badge tone={card.isComplete ? 'accent' : 'dark'}>{card.progress}</Badge>
      </div>
      {card.note ? (
        <p class={styles.note}>{card.note}</p>
      ) : (
        <ol class={styles.rows}>
          {card.rows.map((row) => (
            <li key={row.key} class={styles.row} data-tone={row.tone}>
              <span class={styles.place}>{row.place}</span>
              <span class={styles.team}>
                <TeamName name={row.name} location={row.location} />
              </span>
              <span class={styles.label}>{row.label}</span>
            </li>
          ))}
        </ol>
      )}
    </a>
  );
}

/** The Resume tab of a Season (US-13.8, Task 221): one card for each
 * league, in Season order. A card opens its League Detail. */
export function ResumeTab({ cards }: ResumeTabProps): JSX.Element {
  if (cards.length === 0) return <p class={styles.empty}>No leagues yet.</p>;
  return (
    <div class={styles.grid}>
      {cards.map((card) => (
        <Card key={card.uuid} card={card} />
      ))}
    </div>
  );
}
ResumeTab.displayName = 'ResumeTab';
