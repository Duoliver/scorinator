import type { Phase, PhaseResult } from '@/domain';

/** What the view reads for a league with no phase: nothing to play. */
export const EMPTY_PHASE: Phase = {
  format: 'round-robin',
  fixtures: [],
  byes: [],
  results: [],
};

/** How long a freshly generated score shows in the accent colour. */
export const SCORE_FLASH_MS = 500;

/** The text of the score span: the real score, or `vs` before a result. */
export const scoreText = (result: PhaseResult | undefined): string =>
  result ? `${result.homeGoals} - ${result.awayGoals}` : 'vs';

/** The value of a `data-flashing` attribute: present and empty while the
 * score flashes, absent otherwise. */
export const flashAttr = (flashing: boolean): '' | undefined =>
  flashing ? '' : undefined;
