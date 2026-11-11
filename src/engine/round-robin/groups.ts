import type { Rng } from '@/engine/rng';
import { type GroupSetting, GroupBy } from './types';

/**
 * The group count of a Groups phase (US-02.1). Count mode gives the count.
 * Size mode treats the size as a maximum: teams ÷ size, rounded up, so 18
 * teams with size 4 give 5 groups, and 0 teams give 0 groups.
 *
 * Throws a `RangeError` when the size or count is not a whole number of 2
 * or more, or when the team count is not a whole number of 0 or more.
 */
export function groupCountFor(teamCount: number, setting: GroupSetting): number {
  assertWhole('groupCountFor', 'team count', teamCount, 0);
  if (setting.by === GroupBy.COUNT) {
    assertWhole('groupCountFor', 'group count', setting.count, 2);
    return setting.count;
  }
  assertWhole('groupCountFor', 'group size', setting.size, 2);
  return Math.ceil(teamCount / setting.size);
}

/**
 * The group sizes for a draw (US-02.1): they differ by 1 at most, and the
 * first groups get the extra teams. 18 teams in 5 groups give 4, 4, 4, 3, 3.
 *
 * Throws a `RangeError` when the group count is not a whole number of 0 or
 * more, or when it is 0 with teams to place.
 */
export function groupSizes(teamCount: number, groupCount: number): number[] {
  assertWhole('groupSizes', 'team count', teamCount, 0);
  assertWhole('groupSizes', 'group count', groupCount, 0);
  if (groupCount === 0) {
    if (teamCount > 0) {
      throw new RangeError(`groupSizes cannot place ${teamCount} teams in 0 groups.`);
    }
    return [];
  }
  const base = Math.floor(teamCount / groupCount);
  const extra = teamCount % groupCount;
  return Array.from({ length: groupCount }, (_, i) => (i < extra ? base + 1 : base));
}

/**
 * The random draw of a Groups phase (US-02.1, Task 125 choice 2): shuffles
 * the teams, then deals them in order into the `groupSizes` sizes. The draw
 * is pure random: seeds and Tiers play no part. The same seed gives the
 * same draw. A Shuffle is a new call.
 *
 * Index 0 is Group A. The input does not change.
 */
export function drawGroups<TeamId>(
  teams: readonly TeamId[],
  groupCount: number,
  rng: Rng
): TeamId[][] {
  const shuffled = teams.slice();
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  let next = 0;
  return groupSizes(teams.length, groupCount).map((size) => {
    const group = shuffled.slice(next, next + size);
    next += size;
    return group;
  });
}

/**
 * Adds a team after the draw (US-02.1): to the end of the smallest group,
 * the first one if several are equal. The other teams stay.
 *
 * Throws a `RangeError` when the team is already in a group, or when there
 * are no groups.
 */
export function addToSmallestGroup<TeamId>(
  groups: readonly (readonly TeamId[])[],
  team: TeamId
): TeamId[][] {
  if (groups.length === 0) {
    throw new RangeError('addToSmallestGroup needs at least 1 group.');
  }
  assertNotIn('addToSmallestGroup', groups, team);
  const copy = copyGroups(groups);
  copy[smallestIndex(copy)].push(team);
  return copy;
}

/**
 * Takes a team out of its group (US-02.1). An empty group stays. The other
 * teams stay.
 *
 * Throws a `RangeError` when the team is not in a group.
 */
export function removeFromGroups<TeamId>(
  groups: readonly (readonly TeamId[])[],
  team: TeamId
): TeamId[][] {
  const index = groupIndexOf('removeFromGroups', groups, team);
  const copy = copyGroups(groups);
  copy[index] = copy[index].filter((member) => member !== team);
  return copy;
}

/**
 * A Switch (US-02.1): the new team takes the group and the place of the old
 * one. The other teams stay.
 *
 * Throws a `RangeError` when the old team is not in a group, or when the new
 * team is already in one.
 */
export function switchInGroups<TeamId>(
  groups: readonly (readonly TeamId[])[],
  oldTeam: TeamId,
  newTeam: TeamId
): TeamId[][] {
  const index = groupIndexOf('switchInGroups', groups, oldTeam);
  assertNotIn('switchInGroups', groups, newTeam);
  const copy = copyGroups(groups);
  copy[index] = copy[index].map((member) => (member === oldTeam ? newTeam : member));
  return copy;
}

/**
 * A manual move (US-02.5, Task 125 choice 5): the team goes to the end of
 * the group at `groupIndex`. Sizes can become uneven. A move to its own
 * group changes nothing. The other teams stay.
 *
 * Throws a `RangeError` when the team is not in a group, or when
 * `groupIndex` is not a group.
 */
export function moveToGroup<TeamId>(
  groups: readonly (readonly TeamId[])[],
  team: TeamId,
  groupIndex: number
): TeamId[][] {
  const from = groupIndexOf('moveToGroup', groups, team);
  if (!Number.isInteger(groupIndex) || groupIndex < 0 || groupIndex >= groups.length) {
    throw new RangeError(
      `moveToGroup needs a group index from 0 to ${groups.length - 1}. It got ${groupIndex}.`
    );
  }
  const copy = copyGroups(groups);
  if (from === groupIndex) return copy;
  copy[from] = copy[from].filter((member) => member !== team);
  copy[groupIndex].push(team);
  return copy;
}

/**
 * A manual swap (Task 183): each team takes the place of the other, so the
 * group sizes stay. A later Groups phase where every group has 2 teams can
 * change its draw this way, as no move is allowed there (Task 181).
 *
 * Throws a `RangeError` when a team is not in a group, or when both teams
 * are in the same group.
 */
export function swapInGroups<TeamId>(
  groups: readonly (readonly TeamId[])[],
  first: TeamId,
  second: TeamId
): TeamId[][] {
  const a = groupIndexOf('swapInGroups', groups, first);
  const b = groupIndexOf('swapInGroups', groups, second);
  if (a === b) {
    throw new RangeError('swapInGroups needs two teams of two different groups.');
  }
  const copy = copyGroups(groups);
  copy[a] = copy[a].map((member) => (member === first ? second : member));
  copy[b] = copy[b].map((member) => (member === second ? first : member));
  return copy;
}

/**
 * Changes the group count after the draw (Task 125 choices 3 and 4), for
 * example when an add or a remove in size mode changes `groupCountFor`.
 *
 * - More groups: empty groups go at the end.
 * - Fewer groups: the last smallest group goes, and its teams go one by one
 *   to the smallest group, the first one if several are equal. This repeats
 *   until the count is right.
 *
 * Then, while the sizes differ by more than 1, a random team of a random
 * largest group moves to the first smallest group. So the new groups fill
 * with teams from the largest groups, and sizes that manual moves made
 * uneven even out too. A team that does not move stays in its group. The
 * same count changes nothing.
 *
 * Throws a `RangeError` when the count is not a whole number of 0 or more,
 * or when it is 0 with teams to place. The input does not change.
 */
export function resizeGroups<TeamId>(
  groups: readonly (readonly TeamId[])[],
  groupCount: number,
  rng: Rng
): TeamId[][] {
  assertWhole('resizeGroups', 'group count', groupCount, 0);
  const copy = copyGroups(groups);
  if (groupCount === copy.length) return copy;
  if (groupCount === 0) {
    if (copy.some((group) => group.length > 0)) {
      throw new RangeError('resizeGroups cannot place teams in 0 groups.');
    }
    return [];
  }

  while (copy.length < groupCount) copy.push([]);
  while (copy.length > groupCount) {
    const [removed] = copy.splice(lastSmallestIndex(copy), 1);
    for (const team of removed) copy[smallestIndex(copy)].push(team);
  }

  for (;;) {
    const sizes = copy.map((group) => group.length);
    const largest = Math.max(...sizes);
    if (largest - Math.min(...sizes) <= 1) return copy;
    const largestIndexes = sizes.flatMap((size, i) => (size === largest ? [i] : []));
    const from = largestIndexes[Math.floor(rng() * largestIndexes.length)];
    const [team] = copy[from].splice(Math.floor(rng() * copy[from].length), 1);
    copy[smallestIndex(copy)].push(team);
  }
}

/**
 * The letter of a group (US-02.1, Task 125 choice 6): 0 gives `A`, 25 gives
 * `Z`, then `AA`, `AB`, as in a spreadsheet. The screen adds "Group".
 *
 * Throws a `RangeError` when the index is not a whole number of 0 or more.
 */
export function groupLabel(index: number): string {
  assertWhole('groupLabel', 'index', index, 0);
  let label = '';
  for (let n = index + 1; n > 0; n = Math.floor((n - 1) / 26)) {
    label = String.fromCharCode(65 + ((n - 1) % 26)) + label;
  }
  return label;
}

function copyGroups<TeamId>(groups: readonly (readonly TeamId[])[]): TeamId[][] {
  return groups.map((group) => [...group]);
}

function smallestIndex<TeamId>(groups: readonly (readonly TeamId[])[]): number {
  let best = 0;
  groups.forEach((group, i) => {
    if (group.length < groups[best].length) best = i;
  });
  return best;
}

function lastSmallestIndex<TeamId>(groups: readonly (readonly TeamId[])[]): number {
  let best = 0;
  groups.forEach((group, i) => {
    if (group.length <= groups[best].length) best = i;
  });
  return best;
}

function groupIndexOf<TeamId>(
  caller: string,
  groups: readonly (readonly TeamId[])[],
  team: TeamId
): number {
  const index = groups.findIndex((group) => group.includes(team));
  if (index === -1) {
    throw new RangeError(
      `${caller} got a team that is not in the groups: ${String(team)}.`
    );
  }
  return index;
}

function assertNotIn<TeamId>(
  caller: string,
  groups: readonly (readonly TeamId[])[],
  team: TeamId
): void {
  if (groups.some((group) => group.includes(team))) {
    throw new RangeError(
      `${caller} got a team that is already in the groups: ${String(team)}.`
    );
  }
}

function assertWhole(caller: string, name: string, value: number, min: number): void {
  if (!Number.isInteger(value) || value < min) {
    throw new RangeError(
      `${caller} needs a whole ${name} of ${min} or more. It got ${value}.`
    );
  }
}
