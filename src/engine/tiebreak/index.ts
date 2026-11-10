export {
  PENALTY_KICK_BASE,
  PENALTY_KICK_WEIGHT,
  PENALTY_KICK_MIN,
  PENALTY_KICK_MAX,
  PENALTY_ROUNDS,
  computeKickChance,
  scorinatePenalties,
  tossCoin,
} from './penalties';
export { playTie } from './tie';
export type { TieMatch, TieResult, TieRules, TieTeam } from './types';
export {
  CoinSide,
  TieDecision,
  TieFormat,
  TieMatchPart,
  TiebreakMethod,
} from './types';
