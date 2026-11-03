import type { TieResult, TieRules } from '@/engine/tiebreak';

/** The place of a bracket tie in its league (Task 77). `tie` counts from
 * 1, top to bottom, or is `final` or `third` in the last round. */
export interface BracketTiePosition {
  phase: number;
  round: number;
  tie: number | 'final' | 'third';
}

/**
 * One side of a tie. A `team` slot holds a known team with its seed (Task
 * 79 needs the higher seed). A `bye` slot is the empty side of a bye tie. A
 * `winner-of` slot waits for the winner of a tie of the round before. A
 * `loser-of` slot waits for the loser of a semi-final (the third-place tie).
 */
export type BracketSlot<TeamId> =
  | { kind: 'team'; teamId: TeamId; seed: number }
  | { kind: 'bye' }
  | { kind: 'winner-of'; tieId: string }
  | { kind: 'loser-of'; tieId: string };

/** The kind of a tie. The final and the third-place tie can play as one
 * match (US-04.13). */
export type BracketTieKind = 'regular' | 'final' | 'third';

/** One tie of the tree. A bye tie has a team in the first slot, a `bye` in
 * the second, and no match (US-04.11). The final is tie 1 of the last
 * round, and the third-place tie is tie 2. */
export interface BracketTie<TeamId> {
  id: string;
  round: number;
  tie: number;
  kind: BracketTieKind;
  slots: [BracketSlot<TeamId>, BracketSlot<TeamId>];
}

/** One round of the tree. `teams` is the slots of the round, byes
 * included: 8 for the Quarter-finals. */
export interface BracketRound<TeamId> {
  round: number;
  teams: number;
  ties: BracketTie<TeamId>[];
}

/**
 * The tree of a bracket phase, before any tie is played. With fewer bye
 * teams than byes, the first round cannot start (US-04.10): the result has
 * the counts in place of the rounds.
 */
export type BracketTree<TeamId> =
  | { status: 'ready'; rounds: BracketRound<TeamId>[] }
  | { status: 'missing-byes'; byes: number; assigned: number };

/**
 * The settings of a bracket phase. `TieRules` plus two toggles: the final
 * and the third-place tie as one neutral match (US-04.13), and a
 * third-place tie (US-04.12). Task 140 stores them in the bracket plan.
 */
export interface BracketRules extends TieRules {
  singleMatchFinal: boolean;
  thirdPlace: boolean;
}

/** The bracket settings of a phase plan: `BracketRules` without the
 * league home advantage, which the league holds (Task 139 choice 2). */
export type BracketPlanRules = Omit<BracketRules, 'homeAdvantage'>;

/** The result of one played tie, with its tie id (Task 137 choice 1). */
export type BracketTieResult<TeamId> = TieResult<TeamId> & { tieId: string };

/** One side of a tie, given the results: a known team, a bye, or TBD
 * while its tie has no result (US-04.7). */
export type TieSide<TeamId> =
  { kind: 'team'; teamId: TeamId; seed: number } | { kind: 'bye' } | { kind: 'tbd' };
