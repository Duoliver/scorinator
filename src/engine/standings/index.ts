export { DEFAULT_POINTS_CONFIG, calculateStandings } from './standings';
export { orderAcrossGroups, pickBestOfPlace } from './crossGroup';
export { getLastResults, getPlacesByMatchday } from './matchHistory';
export type {
  FixtureResult,
  MatchOutcome,
  MatchdayFixture,
  MatchdayPlaces,
  TeamMatchResult,
} from './matchHistory';
export type { LotOf, MatchResult, PointsConfig, StandingsRow } from './types';
