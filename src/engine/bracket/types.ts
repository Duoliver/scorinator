/** The place of a bracket tie in its league (Task 77). `tie` counts from
 * 1, top to bottom, or is `final` for the last round. */
export interface BracketTiePosition {
  phase: number;
  round: number;
  tie: number | 'final';
}

/**
 * One side of a tie. A `team` slot holds a known team with its seed (Task
 * 79 needs the higher seed). A `bye` slot is the empty side of a bye tie. A
 * `winner-of` slot waits for the winner of a tie of the round before.
 */
export type BracketSlot<TeamId> =
  | { kind: 'team'; teamId: TeamId; seed: number }
  | { kind: 'bye' }
  | { kind: 'winner-of'; tieId: string };

/** One tie of the tree. A bye tie has a team in the first slot, a `bye` in
 * the second, and no match (US-04.11). */
export interface BracketTie<TeamId> {
  id: string;
  round: number;
  tie: number;
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
