export {
  BASE_GOALS_PER_TEAM,
  REFERENCE_OVR,
  DIFF_WEIGHT,
  ABS_WEIGHT,
  ELASTICITY_MIN,
  ELASTICITY_MAX,
  HOME_ADVANTAGE_BOOST,
  rollElasticity,
  computeExpectedGoals,
  applyHomeAdvantage,
  scorinateMatch,
} from './scorination';
export type { MatchScore } from './types';
