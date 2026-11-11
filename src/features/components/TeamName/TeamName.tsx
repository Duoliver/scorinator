import type { JSX } from 'preact';
import { useState } from 'preact/hooks';
import { Tooltip, useIsCut } from '@/design-system';
import { getNameHint, renderNameHint } from './helpers';
import type TeamNameProps from './types';
import styles from './TeamName.module.css';

export type { TeamNameProps };

/**
 * A team name on a league screen, with its Location in a hint (US-09.3).
 * With a trigram, the markup also holds the trigram in mono, with the name
 * and the Location in its hint (US-09.6, Task 157). The trigram is hidden by
 * default: the screen CSS shows it, and hides the name, in a narrow box.
 * The parts are `data-part="full"` and `data-part="short"`.
 *
 * The screen CSS can cut the name text, `data-part="name"`, with an
 * ellipsis. A cut name gets the name and the Location in its hint (Task
 * 180). A name with no hint is not a Tab stop.
 *
 * Both hints are `notHoverable` (Task 157 review): the pointer goes
 * through a hint to the rows under it, and the hint hides at once.
 */
export function TeamName({ name, location, trigram = '' }: TeamNameProps): JSX.Element {
  const [text, setText] = useState<HTMLElement | null>(null);
  const hint = getNameHint(name, location, useIsCut(text));
  const nameText = (
    <span ref={setText} class={styles.name} data-part="name">
      {name}
    </span>
  );
  return (
    <span class={styles.teamName}>
      <span class={styles.full} data-part="full">
        {hint ? (
          <Tooltip content={hint} notHoverable>
            {nameText}
          </Tooltip>
        ) : (
          nameText
        )}
      </span>
      {trigram && (
        <span class={styles.short} data-part="short">
          <Tooltip content={renderNameHint(name, location)} notHoverable>
            {trigram}
          </Tooltip>
        </span>
      )}
    </span>
  );
}
TeamName.displayName = 'TeamName';
