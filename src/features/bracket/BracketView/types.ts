import type { ConfirmDialogProps } from '@/design-system';
import type { LeagueWrapper } from '@/domain';
import type { LeagueRef } from '@/app/state/databaseStore';

export default interface BracketViewProps {
  league: LeagueWrapper;
  /** The bracket phase, from 0. */
  phaseIndex: number;
  /** The address of the league for its actions: a Season league needs its
   * Season (Task 219 choice 3). The league UUID when not given. */
  leagueRef?: LeagueRef;
  /** Turns off every control that changes the league, as in a finished
   * Season (US-13.9). */
  readOnly?: boolean;
}

/** One team row of a tie card. `scores` has one cell for each score
 * column: the goals of this team in that match, with "*" when the match
 * went to AET, or "" before the play. */
export interface TieCardRow {
  key: string;
  name: string;
  /** The Location of the Blueprint, for the hint (US-09.3), or `''`. */
  location: string;
  colour: string;
  isTbd: boolean;
  isWinner: boolean;
  scores: string[];
}

/** What a tie card shows (US-04.8, Task 141). `columns` holds the score
 * header labels, empty when the card has one score column (choice 3). */
export interface TieCardModel {
  id: string;
  title?: string;
  isBye: boolean;
  rows: [TieCardRow, TieCardRow];
  columns: string[];
  /** The tag of the decision, "Not played", or empty. */
  footer: string;
  /** The aggregate of two legs, for example "3–1", or `null`. */
  aggregate: string | null;
  hasResult: boolean;
  canScorinate: boolean;
}

/** One round column of the tree: its name and its tie cards. */
export interface BracketColumn {
  key: number;
  name: string;
  cards: TieCardModel[];
}

/** What `useBracketView` gives `BracketView`. */
export interface BracketViewState {
  header: string;
  columns: BracketColumn[];
  /** The final winner, when the phase is complete (US-04.14). */
  winner?: { name: string; colour: string };
  /** "Assign 1 / 2 byes to play the first round.", or `undefined`. */
  missingByes?: string;
  canScorinateBracket: boolean;
  scorinateBracket: () => void;
  scorinateTie: (tieId: string) => void;
  /** The "Clear later rounds?" confirm, while it is open (US-04.6). */
  confirm: ConfirmDialogProps | null;
}
