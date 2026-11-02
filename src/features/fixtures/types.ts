import type { TeamDisplay } from '@/features/components';
import type { LeagueWrapper, PhaseResult } from '@/domain';

export default interface FixturesViewProps {
  league: LeagueWrapper;
  /** The started phase to show, from 0. The current phase when not given. */
  phaseIndex?: number;
  /** Which matchday is visible on mount. Uncontrolled after that, the same
   * convention as `Tabs`' `defaultTab`. */
  initialMatchday?: number;
  /** Notified whenever the visible matchday changes. `Tabs` unmounts an
   * inactive tab, so a parent that must keep the matchday across a tab
   * switch stores it here and passes it back as `initialMatchday`. */
  onMatchdayChange?: (matchday: number) => void;
}

/** What `useMatchdayNav` gives the header: the visible matchday, where it
 * sits, and one handler for each jump button. */
export interface MatchdayNav {
  matchday: number;
  totalMatchdays: number;
  canGoBack: boolean;
  canGoForward: boolean;
  /** True when every match has a result: the header shows a League
   * completed badge in place of the Current matchday button. */
  leagueCompleted: boolean;
  /** True when the visible matchday is the first one with an unplayed
   * match. Always false for a completed league. */
  atCurrentMatchday: boolean;
  goToFirst: () => void;
  goToPrevious: () => void;
  goToNext: () => void;
  goToLast: () => void;
  goToCurrent: () => void;
}

/** One match row of the visible matchday, ready to render. */
export interface FixtureRow {
  key: string;
  /** The group letter of the match in a Groups phase ("A"), or `undefined`
   * in a round robin (Task 131 choice 6). */
  groupTag: string | undefined;
  home: TeamDisplay;
  away: TeamDisplay;
  result: PhaseResult | undefined;
  /** True for `SCORE_FLASH_MS` after the score of this match is generated. */
  flashing: boolean;
  /** Scorinate for an unplayed match, Re-scorinate for a played one. */
  scorinate: () => void;
}

/** One team with a bye on the visible matchday. A Groups phase has one
 * for each group with a bye, with its group letter (Task 131 choice 6). */
export interface ByeRow {
  key: string;
  groupTag: string | undefined;
  teamName: string;
}

/** What `useFixtures` gives `FixturesView`. */
export interface Fixtures {
  hasFixtures: boolean;
  nav: MatchdayNav;
  rows: FixtureRow[];
  /** The byes of the visible matchday, in group order. */
  byes: ByeRow[];
  matchdayFullyPlayed: boolean;
  scorinateMatchday: () => void;
}
