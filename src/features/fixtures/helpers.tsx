import type { JSX } from 'preact';
import { Badge } from '@/design-system';
import { groupLabel } from '@/engine/round-robin';
import type { LeagueWrapper, PhaseResult, ScheduledPhase } from '@/domain';
import styles from './FixturesView.module.css';
import { Legs, PhaseFormat } from '@/engine/phases';

/** What the view reads for a league with no phase, or a bracket phase:
 * nothing to play. */
export const EMPTY_PHASE: ScheduledPhase = {
  format: PhaseFormat.ROUND_ROBIN,
  legs: Legs.TWO_WAY,
  fixtures: [],
  byes: [],
  results: [],
};

/** The phase that the view shows: `phaseIndex`, or the current phase (the
 * last started one) when not given. */
export function getShownPhase(
  league: LeagueWrapper,
  phaseIndex?: number
): ScheduledPhase {
  const { phases } = league.content;
  const phase = phases[phaseIndex ?? phases.length - 1];
  // A bracket has ties, not fixtures: Task 141 shows it in its own tab.
  return phase && phase.format !== PhaseFormat.BRACKET ? phase : EMPTY_PHASE;
}

/** The group index of each team of a Groups phase, from the draw, so the
 * view never parses a fixture id (Task 77). Empty for a round robin. */
export function getGroupIndexes(phase: ScheduledPhase): Map<string, number> {
  const indexes = new Map<string, number>();
  if (phase.format !== PhaseFormat.GROUPS) return indexes;
  phase.groups.forEach((members, index) => {
    for (const team of members) indexes.set(team, index);
  });
  return indexes;
}

/** The group letter of a group index, or `undefined` for no group. */
export function getGroupTag(index: number | undefined): string | undefined {
  return index === undefined ? undefined : groupLabel(index);
}

/** The group tag of a match or a bye (Task 131 choice 6): the letter in a
 * warning badge, as in the handoff. A screen reader reads "Group A". */
export const GroupTag = ({ letter }: { letter: string }): JSX.Element => (
  <span class={styles.groupTag}>
    <Badge tone="warning">
      <span class={styles.visuallyHidden}>Group {letter}</span>
      <span aria-hidden="true">{letter}</span>
    </Badge>
  </span>
);

/** The badge of a complete phase, with its short form for a narrow
 * header (Task 132 choice 7). */
export function getCompleteBadge(isLastPhase: boolean): {
  full: string;
  short: string;
} {
  return isLastPhase
    ? { full: 'League completed', short: 'Completed' }
    : { full: 'Phase complete', short: 'Complete' };
}

/** How long a freshly generated score shows in the accent colour. */
export const SCORE_FLASH_MS = 500;

/** The text of the score span: the real score, or `vs` before a result. */
export const scoreText = (result: PhaseResult | undefined): string =>
  result ? `${result.homeGoals} - ${result.awayGoals}` : 'vs';

/** The value of a `data-flashing` attribute: present and empty while the
 * score flashes, absent otherwise. */
export const flashAttr = (flashing: boolean): '' | undefined =>
  flashing ? '' : undefined;
