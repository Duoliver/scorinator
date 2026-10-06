import type { LeagueResult } from '@/features/leagues/types';
import type { MatchIdentity } from './types';

/** How long a freshly generated score shows in the accent colour. */
export const SCORE_FLASH_MS = 500;

export const fixtureKey = (match: MatchIdentity): string =>
  `${match.matchday}-${match.home}-${match.away}`;

/** The text of the score span: the real score, or `vs` before a result. */
export const scoreText = (result: LeagueResult | undefined): string =>
  result ? `${result.homeGoals} - ${result.awayGoals}` : 'vs';

/** The value of a `data-flashing` attribute: present and empty while the
 * score flashes, absent otherwise. */
export const flashAttr = (flashing: boolean): '' | undefined =>
  flashing ? '' : undefined;
