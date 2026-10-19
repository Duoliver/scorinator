import type { JSX } from 'preact';
import type TeamSwatchProps from './types';
import type { TeamSwatchSize } from './types';
import { getTeamSwatchClassName } from './helpers';

export type { TeamSwatchProps, TeamSwatchSize };

/** The square of team colour next to a team name. The colour comes from
 * data, so it is the one inline style the coding standards allow. It is
 * hidden from screen readers, because the team name next to it already
 * says which team it is. */
export function TeamSwatch({
  colour,
  size = 'md',
  class: extraClass,
}: TeamSwatchProps): JSX.Element {
  return (
    <span
      class={getTeamSwatchClassName(size, extraClass)}
      style={{ background: colour || 'transparent' }}
      aria-hidden="true"
    />
  );
}
TeamSwatch.displayName = 'TeamSwatch';
