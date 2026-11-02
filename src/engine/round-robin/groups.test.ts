import { describe, expect, it } from 'vitest';
import {
  addToSmallestGroup,
  drawGroups,
  groupCountFor,
  groupLabel,
  groupSizes,
  moveToGroup,
  swapInGroups,
  removeFromGroups,
  resizeGroups,
  switchInGroups,
} from './index';
import { createSeededRng } from '@/engine/rng';

function teamsOf(n: number): string[] {
  return Array.from({ length: n }, (_, i) => `T${i + 1}`);
}

const sizesOf = (groups: readonly (readonly string[])[]): number[] =>
  groups.map((group) => group.length);

const allTeams = (groups: readonly (readonly string[])[]): string[] =>
  groups.flat().sort();

const spread = (groups: readonly (readonly string[])[]): number =>
  Math.max(...sizesOf(groups)) - Math.min(...sizesOf(groups));

describe('groupCountFor', () => {
  it('gives the count in count mode', () => {
    expect(groupCountFor(18, { by: 'count', count: 3 })).toBe(3);
    expect(groupCountFor(0, { by: 'count', count: 3 })).toBe(3);
  });

  it('gives teams ÷ size, rounded up, in size mode', () => {
    expect(groupCountFor(18, { by: 'size', size: 4 })).toBe(5);
    expect(groupCountFor(16, { by: 'size', size: 4 })).toBe(4);
    expect(groupCountFor(17, { by: 'size', size: 4 })).toBe(5);
    expect(groupCountFor(3, { by: 'size', size: 4 })).toBe(1);
    expect(groupCountFor(0, { by: 'size', size: 4 })).toBe(0);
  });

  it('throws a RangeError for a size or count that is not a whole number of 2 or more', () => {
    for (const bad of [1, 0, -2, 2.5, Number.NaN]) {
      expect(() => groupCountFor(8, { by: 'size', size: bad })).toThrow(RangeError);
      expect(() => groupCountFor(8, { by: 'count', count: bad })).toThrow(RangeError);
    }
  });

  it('throws a RangeError for a team count that is not a whole number of 0 or more', () => {
    expect(() => groupCountFor(-1, { by: 'size', size: 4 })).toThrow(RangeError);
    expect(() => groupCountFor(1.5, { by: 'count', count: 2 })).toThrow(RangeError);
  });
});

describe('groupSizes', () => {
  it('gives sizes that differ by 1 at most, the first groups larger', () => {
    expect(groupSizes(18, 5)).toEqual([4, 4, 4, 3, 3]);
    expect(groupSizes(16, 4)).toEqual([4, 4, 4, 4]);
    expect(groupSizes(7, 3)).toEqual([3, 2, 2]);
    expect(groupSizes(3, 4)).toEqual([1, 1, 1, 0]);
    expect(groupSizes(0, 0)).toEqual([]);
  });

  it('throws a RangeError for no groups with teams, or a count that is not whole', () => {
    expect(() => groupSizes(4, 0)).toThrow(RangeError);
    expect(() => groupSizes(4, 1.5)).toThrow(RangeError);
    expect(() => groupSizes(4, -1)).toThrow(RangeError);
  });
});

describe('drawGroups', () => {
  it('puts each team in one group, with the groupSizes sizes', () => {
    const groups = drawGroups(teamsOf(18), 5, createSeededRng(1));
    expect(sizesOf(groups)).toEqual([4, 4, 4, 3, 3]);
    expect(allTeams(groups)).toEqual(teamsOf(18).sort());
  });

  it('gives the same draw for the same seed, and another draw for another seed', () => {
    const first = drawGroups(teamsOf(12), 3, createSeededRng(9));
    expect(drawGroups(teamsOf(12), 3, createSeededRng(9))).toEqual(first);
    expect(drawGroups(teamsOf(12), 3, createSeededRng(10))).not.toEqual(first);
  });

  it('puts each team in each group about equally often: 20% to 30% of 2,000 seeds for 4 groups', () => {
    const counts = new Map<string, number[]>();
    for (const team of teamsOf(8)) counts.set(team, [0, 0, 0, 0]);
    for (let seed = 1; seed <= 2000; seed++) {
      drawGroups(teamsOf(8), 4, createSeededRng(seed)).forEach((group, index) => {
        for (const team of group) counts.get(team)![index]++;
      });
    }
    for (const perGroup of counts.values()) {
      for (const count of perGroup) {
        expect(count / 2000).toBeGreaterThanOrEqual(0.2);
        expect(count / 2000).toBeLessThanOrEqual(0.3);
      }
    }
  });

  it('gives empty groups when there are no teams', () => {
    expect(drawGroups([], 3, createSeededRng(1))).toEqual([[], [], []]);
  });

  it('does not change its input', () => {
    const teams = teamsOf(6);
    drawGroups(teams, 2, createSeededRng(4));
    expect(teams).toEqual(teamsOf(6));
  });
});

describe('addToSmallestGroup', () => {
  it('adds the team to the end of the smallest group', () => {
    expect(addToSmallestGroup([['A', 'B'], ['C'], ['D', 'E']], 'F')).toEqual([
      ['A', 'B'],
      ['C', 'F'],
      ['D', 'E'],
    ]);
  });

  it('takes the first group when several are the smallest', () => {
    expect(addToSmallestGroup([['A'], ['B'], []], 'C')).toEqual([['A'], ['B'], ['C']]);
    expect(addToSmallestGroup([['A'], ['B']], 'C')).toEqual([['A', 'C'], ['B']]);
  });

  it('throws a RangeError for a team that is already in, or for no groups', () => {
    expect(() => addToSmallestGroup([['A'], ['B']], 'A')).toThrow(RangeError);
    expect(() => addToSmallestGroup([], 'A')).toThrow(RangeError);
  });

  it('does not change its input', () => {
    const groups = [['A'], ['B']];
    addToSmallestGroup(groups, 'C');
    expect(groups).toEqual([['A'], ['B']]);
  });
});

describe('removeFromGroups', () => {
  it('takes the team out of its group, and keeps the rest', () => {
    expect(removeFromGroups([['A', 'B', 'C'], ['D']], 'B')).toEqual([
      ['A', 'C'],
      ['D'],
    ]);
  });

  it('keeps an empty group', () => {
    expect(removeFromGroups([['A'], ['D']], 'D')).toEqual([['A'], []]);
  });

  it('throws a RangeError for a team that is not in the groups', () => {
    expect(() => removeFromGroups([['A']], 'Z')).toThrow(RangeError);
  });
});

describe('switchInGroups', () => {
  it('puts the new team in the place of the old one', () => {
    expect(switchInGroups([['A', 'B'], ['C']], 'A', 'N')).toEqual([['N', 'B'], ['C']]);
  });

  it('throws a RangeError for an old team that is not in, or a new team that is already in', () => {
    expect(() => switchInGroups([['A'], ['B']], 'Z', 'N')).toThrow(RangeError);
    expect(() => switchInGroups([['A'], ['B']], 'A', 'B')).toThrow(RangeError);
  });
});

describe('moveToGroup', () => {
  it('moves the team to the end of the other group, and sizes can become uneven', () => {
    expect(
      moveToGroup(
        [
          ['A', 'B'],
          ['C', 'D'],
        ],
        'A',
        1
      )
    ).toEqual([['B'], ['C', 'D', 'A']]);
  });

  it('changes nothing for a move to its own group', () => {
    expect(moveToGroup([['A', 'B'], ['C']], 'A', 0)).toEqual([['A', 'B'], ['C']]);
  });

  it('throws a RangeError for an unknown team or a bad group index', () => {
    const groups = [['A'], ['B']];
    expect(() => moveToGroup(groups, 'Z', 0)).toThrow(RangeError);
    expect(() => moveToGroup(groups, 'A', 2)).toThrow(RangeError);
    expect(() => moveToGroup(groups, 'A', -1)).toThrow(RangeError);
    expect(() => moveToGroup(groups, 'A', 0.5)).toThrow(RangeError);
  });

  it('does not change its input', () => {
    const groups = [['A', 'B'], ['C']];
    moveToGroup(groups, 'A', 1);
    expect(groups).toEqual([['A', 'B'], ['C']]);
  });
});

describe('resizeGroups', () => {
  it('adds groups and fills them with teams from the largest groups: 4 x 4 to 5 groups', () => {
    for (let seed = 1; seed <= 50; seed++) {
      const before = drawGroups(teamsOf(16), 4, createSeededRng(seed));
      const after = resizeGroups(before, 5, createSeededRng(seed + 1000));
      expect(after).toHaveLength(5);
      expect(spread(after)).toBeLessThanOrEqual(1);
      expect(allTeams(after)).toEqual(allTeams(before));
      expect(after[4]).toHaveLength(3);
      // The rest of the draw stays: a team in groups 0 to 3 is where it was.
      for (let index = 0; index < 4; index++) {
        for (const team of after[index]) expect(before[index]).toContain(team);
      }
    }
  });

  it('picks the moved teams at random', () => {
    const before = drawGroups(teamsOf(16), 4, createSeededRng(1));
    const newGroups = new Set<string>();
    for (let seed = 1; seed <= 20; seed++) {
      newGroups.add(
        [...resizeGroups(before, 5, createSeededRng(seed))[4]].sort().join()
      );
    }
    expect(newGroups.size).toBeGreaterThan(1);
  });

  it('removes the last smallest group, and gives its teams to the smallest groups', () => {
    const before = [
      ['A', 'B', 'C'],
      ['D', 'E'],
      ['F', 'G', 'H'],
      ['I', 'J'],
    ];
    // I goes to the smallest group (D, E). Then all three have 3 teams, so
    // J goes to the first group.
    expect(resizeGroups(before, 3, createSeededRng(1))).toEqual([
      ['A', 'B', 'C', 'J'],
      ['D', 'E', 'I'],
      ['F', 'G', 'H'],
    ]);
  });

  it('removes several groups for a larger drop', () => {
    const before = drawGroups(teamsOf(20), 5, createSeededRng(3));
    const after = resizeGroups(before, 2, createSeededRng(4));
    expect(after).toHaveLength(2);
    expect(spread(after)).toBeLessThanOrEqual(1);
    expect(allTeams(after)).toEqual(allTeams(before));
  });

  it('also evens out sizes that manual moves made uneven (choice 4)', () => {
    const uneven = [['A', 'B', 'C', 'D', 'E'], ['F'], ['G', 'H']];
    const grown = resizeGroups(uneven, 4, createSeededRng(2));
    expect(spread(grown)).toBeLessThanOrEqual(1);
    const shrunk = resizeGroups(uneven, 2, createSeededRng(2));
    expect(spread(shrunk)).toBeLessThanOrEqual(1);
    expect(allTeams(shrunk)).toEqual(allTeams(uneven));
  });

  it('changes nothing for the same count', () => {
    const groups = [['A', 'B', 'C'], ['D']];
    expect(resizeGroups(groups, 2, createSeededRng(1))).toEqual(groups);
  });

  it('gives no groups for a count of 0 with no teams, and throws a RangeError with teams', () => {
    expect(resizeGroups([[], []], 0, createSeededRng(1))).toEqual([]);
    expect(() => resizeGroups([['A'], []], 0, createSeededRng(1))).toThrow(RangeError);
    expect(() => resizeGroups([['A']], 1.5, createSeededRng(1))).toThrow(RangeError);
  });

  it('gives the same result for the same seed, and does not change its input', () => {
    const before = drawGroups(teamsOf(16), 4, createSeededRng(7));
    const copy = before.map((group) => [...group]);
    expect(resizeGroups(before, 5, createSeededRng(8))).toEqual(
      resizeGroups(before, 5, createSeededRng(8))
    );
    expect(before).toEqual(copy);
  });

  it('follows a size-mode league as teams are added one by one (size 4)', () => {
    const rng = createSeededRng(11);
    let groups: string[][] = [];
    for (const team of teamsOf(18)) {
      const count = groupCountFor(allTeams(groups).length + 1, { by: 'size', size: 4 });
      groups = addToSmallestGroup(resizeGroups(groups, count, rng), team);
      expect(spread(groups)).toBeLessThanOrEqual(1);
    }
    expect(groups).toHaveLength(5);
    expect(sizesOf(groups).sort()).toEqual([3, 3, 4, 4, 4]);
  });
});

describe('groupLabel', () => {
  it('gives A to Z, then AA, AB, as in a spreadsheet', () => {
    expect(groupLabel(0)).toBe('A');
    expect(groupLabel(1)).toBe('B');
    expect(groupLabel(25)).toBe('Z');
    expect(groupLabel(26)).toBe('AA');
    expect(groupLabel(27)).toBe('AB');
    expect(groupLabel(51)).toBe('AZ');
    expect(groupLabel(52)).toBe('BA');
    expect(groupLabel(701)).toBe('ZZ');
    expect(groupLabel(702)).toBe('AAA');
  });

  it('throws a RangeError for an index that is not a whole number of 0 or more', () => {
    expect(() => groupLabel(-1)).toThrow(RangeError);
    expect(() => groupLabel(1.5)).toThrow(RangeError);
  });
});

describe('swapInGroups (Task 183)', () => {
  it('puts each team in the place of the other, so the sizes stay', () => {
    expect(
      swapInGroups(
        [
          ['A', 'B'],
          ['C', 'D'],
        ],
        'B',
        'C'
      )
    ).toEqual([
      ['A', 'C'],
      ['B', 'D'],
    ]);
  });

  it('throws a RangeError for an unknown team, or two teams of one group', () => {
    const groups = [['A', 'B'], ['C']];
    expect(() => swapInGroups(groups, 'Z', 'C')).toThrow(RangeError);
    expect(() => swapInGroups(groups, 'A', 'Z')).toThrow(RangeError);
    expect(() => swapInGroups(groups, 'A', 'B')).toThrow(RangeError);
  });

  it('does not change its input', () => {
    const groups = [['A', 'B'], ['C']];
    swapInGroups(groups, 'A', 'C');
    expect(groups).toEqual([['A', 'B'], ['C']]);
  });
});
