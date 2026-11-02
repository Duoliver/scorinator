import { describe, expect, it } from 'vitest';
import type { GroupsPlan, PhasePlan } from '@/engine/phases';
import { createSeededRng } from '@/engine/rng';
import {
  groupsAfterAdd,
  groupsAfterRemove,
  groupsAfterSwitch,
  groupsForPlan,
} from './phaseOneGroups';

const bySize = (size: number, top?: number, bestOfNext = 0): GroupsPlan => ({
  format: 'groups',
  legs: 'two-way',
  grouping: { by: 'size', size },
  ...(top === undefined ? {} : { advance: { top, bestOfNext } }),
});
const byCount = (count: number): GroupsPlan => ({
  format: 'groups',
  legs: 'two-way',
  grouping: { by: 'count', count },
});
const rr: PhasePlan = { format: 'round-robin', legs: 'two-way' };
const rng = (): (() => number) => createSeededRng(7);
const sizes = (groups: readonly (readonly string[])[] | null): number[] =>
  (groups ?? []).map((group) => group.length);
const teams = (n: number): string[] => Array.from({ length: n }, (_, i) => `T${i + 1}`);

describe('groupsForPlan (a phase-1 plan change)', () => {
  it('gives no draw when phase 1 is not Groups', () => {
    expect(groupsForPlan([['T1', 'T2']], rr, teams(2), rng())).toBeNull();
  });

  it('draws every team when phase 1 becomes Groups', () => {
    const groups = groupsForPlan(null, byCount(2), teams(6), rng());
    expect(sizes(groups)).toEqual([3, 3]);
    expect(groups?.flat().sort()).toEqual(teams(6).sort());
  });

  it('gives empty groups in count mode with no teams, and none in size mode', () => {
    expect(groupsForPlan(null, byCount(3), [], rng())).toEqual([[], [], []]);
    expect(groupsForPlan(null, bySize(4), [], rng())).toEqual([]);
  });

  it('resizes the draw when the group setting changes, and keeps the rest', () => {
    const before = [
      ['T1', 'T2', 'T3', 'T4'],
      ['T5', 'T6', 'T7', 'T8'],
    ];
    const after = groupsForPlan(before, bySize(3), teams(8), rng());
    expect(sizes(after).sort()).toEqual([2, 3, 3]);
    expect(after?.flat().sort()).toEqual(teams(8).sort());
  });

  it('keeps the draw for a group setting that is not valid', () => {
    const before = [['T1', 'T2'], ['T3']];
    expect(groupsForPlan(before, bySize(Number.NaN), teams(3), rng())).toEqual(before);
  });
});

describe('groupsAfterAdd (US-02.1)', () => {
  it('puts each added team into the smallest group, the first one on a tie', () => {
    expect(groupsAfterAdd([['T1', 'T2'], ['T3']], byCount(2), ['T4'], rng())).toEqual([
      ['T1', 'T2'],
      ['T3', 'T4'],
    ]);
    expect(groupsAfterAdd([['T1'], ['T2']], byCount(2), ['T3'], rng())).toEqual([
      ['T1', 'T3'],
      ['T2'],
    ]);
  });

  it('opens a new group in size mode when the count grows', () => {
    const four = [['T1', 'T2', 'T3', 'T4']];
    const after = groupsAfterAdd(four, bySize(4), ['T5'], rng());
    expect(after).toHaveLength(2);
    expect(sizes(after).sort()).toEqual([2, 3]);
  });

  it('adds many teams one by one, as "Load them all" does', () => {
    const after = groupsAfterAdd([], bySize(4), teams(18), rng());
    expect(sizes(after).sort()).toEqual([3, 3, 4, 4, 4]);
  });
});

describe('groupsAfterRemove', () => {
  it('takes the team out of its group', () => {
    expect(
      groupsAfterRemove(
        [
          ['T1', 'T2'],
          ['T3', 'T4'],
        ],
        byCount(2),
        'T2',
        rng()
      )
    ).toEqual([['T1'], ['T3', 'T4']]);
  });

  it('closes a group in size mode when the count drops', () => {
    const groups = [
      ['T1', 'T2', 'T3'],
      ['T4', 'T5'],
    ];
    const after = groupsAfterRemove(groups, bySize(4), 'T5', rng());
    expect(after).toHaveLength(1);
    expect(after[0].sort()).toEqual(['T1', 'T2', 'T3', 'T4']);
  });
});

describe('groupsAfterSwitch (US-02.1)', () => {
  it('puts the new team in the place of the old one', () => {
    expect(groupsAfterSwitch([['T1', 'T2'], ['T3']], 'T2', 'N')).toEqual([
      ['T1', 'N'],
      ['T3'],
    ]);
  });
});
