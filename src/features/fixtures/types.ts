import type { Fixture } from '@/engine/fixtures';
import type { TeamDisplay } from '@/features/components';
import type { LeagueRecord, LeagueResult } from '@/features/leagues/types';

export default interface FixturesViewProps {
  league: LeagueRecord;
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
  home: TeamDisplay;
  away: TeamDisplay;
  result: LeagueResult | undefined;
  /** True for `SCORE_FLASH_MS` after the score of this match is generated. */
  flashing: boolean;
  /** Scorinate for an unplayed match, Re-scorinate for a played one. */
  scorinate: () => void;
}

/** What `useFixtures` gives `FixturesView`. */
export interface Fixtures {
  hasFixtures: boolean;
  nav: MatchdayNav;
  rows: FixtureRow[];
  /** The name of the team with a bye on the visible matchday, if any. */
  byeTeamName: string | undefined;
  matchdayFullyPlayed: boolean;
  scorinateMatchday: () => void;
}

/** The fields that identify one match, shared by `Fixture` and
 * `LeagueResult`. */
export type MatchIdentity = Pick<Fixture<string>, 'matchday' | 'home' | 'away'>;
