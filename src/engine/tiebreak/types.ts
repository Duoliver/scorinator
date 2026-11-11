import type { MatchScore } from '@/engine/scorination';

/** The tie format of a bracket phase (US-04.1). */
export const TieFormat = {
  SINGLE_MATCH: 'single-match',
  TWO_LEGGED: 'two-legged',
} as const;
export type TieFormat = (typeof TieFormat)[keyof typeof TieFormat];

/** What decides a tie that is still level after AET, or without AET
 * (US-03.2). A replay that stays level goes to the coin toss. */
export const TiebreakMethod = {
  PENALTIES: 'penalties',
  REPLAY_COIN_TOSS: 'replay-coin-toss',
} as const;
export type TiebreakMethod = (typeof TiebreakMethod)[keyof typeof TiebreakMethod];

/**
 * The rules of one tie. Task 140 stores the first four in the bracket plan.
 * `homeAdvantage` is the league toggle: only the legs of a two-legged tie
 * use it. A single-match final in a two-legged phase (US-04.13) comes here
 * as `single-match` with `awayGoals` off.
 */
export interface TieRules {
  format: TieFormat;
  awayGoals: boolean;
  playsAet: boolean;
  method: TiebreakMethod;
  homeAdvantage: boolean;
}

/** One team of a tie, with its stored OVR for this league. */
export interface TieTeam<TeamId> {
  id: TeamId;
  ovr: number;
}

/** The part of a tie a match plays. It is the last part of the fixture id
 * (Task 77), for example `p3.r2.t1.leg2`. */
export const TieMatchPart = { LEG1: 'leg1', LEG2: 'leg2', REPLAY: 'replay' } as const;
export type TieMatchPart = (typeof TieMatchPart)[keyof typeof TieMatchPart];

/**
 * One match of a tie. `score` is the score after 90 minutes. `aet` holds the
 * AET goals only, apart from the score, so a later display can show the
 * score before AET (future features §22).
 */
export interface TieMatch<TeamId> {
  part: TieMatchPart;
  homeId: TeamId;
  awayId: TeamId;
  score: MatchScore;
  aet?: MatchScore;
}

/** The step that gave the tie its winner. `regulation` is the 90-minute
 * score of a single match, or the aggregate of two legs. `replay` includes
 * the AET of the replay. */
export const TieDecision = {
  REGULATION: 'regulation',
  AWAY_GOALS: 'away-goals',
  AET: 'aet',
  PENALTIES: 'penalties',
  REPLAY: 'replay',
  COIN_TOSS: 'coin-toss',
} as const;
export type TieDecision = (typeof TieDecision)[keyof typeof TieDecision];

/** The side of a match that wins a coin toss. */
export const CoinSide = { HOME: 'home', AWAY: 'away' } as const;
export type CoinSide = (typeof CoinSide)[keyof typeof CoinSide];

/**
 * A played tie. The matches are in play order. `penalties` is the shootout
 * score, by the home and away of the last match before it.
 */
export interface TieResult<TeamId> {
  matches: TieMatch<TeamId>[];
  penalties?: MatchScore;
  winnerId: TeamId;
  loserId: TeamId;
  decidedBy: TieDecision;
}
