export { generateRoundRobin } from './roundRobin';
export { generateSingleDuels } from './singleDuels';
export { assignFixtureIds, fixtureId } from './fixtureIds';
export {
  addToSmallestGroup,
  drawGroups,
  groupCountFor,
  groupLabel,
  groupSizes,
  moveToGroup,
  removeFromGroups,
  resizeGroups,
  switchInGroups,
} from './groups';
export {
  findPhaseCurrentMatchday,
  findPhaseResult,
  isPhaseMatchdayPlayed,
} from './schedule';
export type {
  Bye,
  Fixture,
  FixturePosition,
  GroupSetting,
  PhaseFixture,
  RoundRobinSchedule,
} from './types';
