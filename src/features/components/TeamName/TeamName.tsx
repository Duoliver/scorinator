import type { JSX } from 'preact';
import { Tooltip } from '@/design-system';
import { getTrigramHint } from './helpers';
import type TeamNameProps from './types';
import styles from './TeamName.module.css';

export type { TeamNameProps };

/**
 * A team name on a league screen, with its Location in a hint (US-09.3).
 * A team with no Location has no hint and is not a Tab stop. With a
 * trigram, the markup also holds the trigram in mono, with the name and
 * the Location in its hint (US-09.6, Task 157). The trigram is hidden by
 * default: the screen CSS shows it, and hides the name, in a narrow box.
 * The parts are `data-part="full"` and `data-part="short"`.
 *
 * Both hints are `notHoverable` (Task 157 review): the pointer goes
 * through a hint to the rows under it, and the hint hides at once.
 */
export function TeamName({ name, location, trigram = '' }: TeamNameProps): JSX.Element {
  return (
    <span class={styles.teamName}>
      <span class={styles.full} data-part="full">
        {location ? (
          <Tooltip content={location} notHoverable>
            {name}
          </Tooltip>
        ) : (
          name
        )}
      </span>
      {trigram && (
        <span class={styles.short} data-part="short">
          <Tooltip content={getTrigramHint(name, location)} notHoverable>
            {trigram}
          </Tooltip>
        </span>
      )}
    </span>
  );
}
TeamName.displayName = 'TeamName';
