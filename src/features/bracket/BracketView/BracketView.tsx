import type { JSX } from 'preact';
import { Button, ConfirmDialog } from '@/design-system';
import { TeamSwatch } from '@/features/components';
import type BracketViewProps from './types';
import { TieCard } from './TieCard';
import { useBracketView } from './useBracketView';
import styles from './BracketView.module.css';

export type { BracketViewProps };

/**
 * The Bracket view of a bracket phase (Task 141): the header line with
 * "Scorinate bracket", the winner, and the tree, one column for each round,
 * left to right (US-04.8, US-04.14). The ties of a column share its height,
 * so a later tie sits between its two source ties (choice 2).
 */
export function BracketView(props: BracketViewProps): JSX.Element {
  const view = useBracketView(props);
  return (
    <div class={styles.view}>
      <div class={styles.header}>
        <p class={styles.line}>{view.header}</p>
        <Button disabled={!view.canScorinateBracket} onClick={view.scorinateBracket}>
          ⚽ Scorinate bracket
        </Button>
      </div>
      {view.winner && (
        <p class={styles.winner}>
          <TeamSwatch colour={view.winner.colour} />
          {`Winner: ${view.winner.name}`}
        </p>
      )}
      {view.missingByes && <p class={styles.note}>{view.missingByes}</p>}
      <div class={styles.tree}>
        {view.columns.map((column) => (
          <section key={column.key} class={styles.column} aria-label={column.name}>
            <h4 class={styles.round}>{column.name}</h4>
            <div class={styles.ties}>
              {column.cards.map((card) => (
                <TieCard key={card.id} card={card} onScorinate={view.scorinateTie} />
              ))}
            </div>
          </section>
        ))}
      </div>
      {view.confirm && <ConfirmDialog {...view.confirm} />}
    </div>
  );
}
BracketView.displayName = 'BracketView';
