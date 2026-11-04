import { describe, expect, it } from 'vitest';
import { isSameContent, planImport, resolveImport, type ImportChoice } from './index';

interface Item {
  uuid: string;
  name: string;
  madeBy?: string;
}

const PROVENANCE = new Set(['madeBy']);
const same = (a: Item, b: Item): boolean => isSameContent(a, b, PROVENANCE);

describe('isSameContent (US-11.2)', () => {
  it('is true for equal values, with the keys in another order', () => {
    expect(
      isSameContent(
        { a: 1, b: [1, { c: 'x' }] },
        { b: [1, { c: 'x' }], a: 1 },
        new Set()
      )
    ).toBe(true);
  });

  it('is false for a changed value, at any depth', () => {
    expect(isSameContent({ a: { b: [1, 2] } }, { a: { b: [1, 3] } }, new Set())).toBe(
      false
    );
    expect(isSameContent({ a: [1, 2] }, { a: [1, 2, 3] }, new Set())).toBe(false);
    expect(isSameContent({ a: 1 }, { a: 1, b: 2 }, new Set())).toBe(false);
  });

  it('skips the ignored keys, at any depth', () => {
    expect(
      isSameContent(
        { name: 'A', madeBy: 'x', inner: { madeBy: 'y', n: 1 } },
        { name: 'A', madeBy: 'z', inner: { n: 1 } },
        PROVENANCE
      )
    ).toBe(true);
  });

  it('counts a key with an undefined value as absent', () => {
    expect(isSameContent({ a: 1, b: undefined }, { a: 1 }, new Set())).toBe(true);
  });

  it('does not mix an array with an object, or null with an object', () => {
    expect(isSameContent({ a: [] }, { a: {} }, new Set())).toBe(false);
    expect(isSameContent({ a: null }, { a: {} }, new Set())).toBe(false);
  });
});

describe('planImport (US-11.2)', () => {
  const local: Item[] = [
    { uuid: 'u1', name: 'One', madeBy: 'here' },
    { uuid: 'u2', name: 'Two', madeBy: 'here' },
  ];
  const findLocal = (uuid: string): Item | undefined =>
    local.find((item) => item.uuid === uuid);

  it('sorts each item: unknown is new, same content is same, the rest is a conflict', () => {
    const incoming: Item[] = [
      { uuid: 'u3', name: 'Three' },
      { uuid: 'u1', name: 'One', madeBy: 'there' },
      { uuid: 'u2', name: 'Two, renamed' },
    ];
    expect(planImport(incoming, findLocal, same)).toEqual([
      { kind: 'new', incoming: incoming[0] },
      { kind: 'same', incoming: incoming[1] },
      { kind: 'conflict', incoming: incoming[2], local: local[1] },
    ]);
  });

  it('gives no step for no item', () => {
    expect(planImport([], findLocal, same)).toEqual([]);
  });
});

describe('resolveImport (US-11.2)', () => {
  const steps = planImport<Item>(
    [
      { uuid: 'n1', name: 'New' },
      { uuid: 's1', name: 'Same' },
      { uuid: 'c1', name: 'Conflict 1' },
      { uuid: 'c2', name: 'Conflict 2' },
    ],
    (uuid) =>
      uuid === 's1'
        ? { uuid, name: 'Same' }
        : uuid.startsWith('c')
          ? { uuid, name: 'Local' }
          : undefined,
    same
  );

  it('adds a new item as it is, and a conflict on "new" as new', () => {
    const choices = new Map<string, ImportChoice>([
      ['c1', 'new'],
      ['c2', 'skip'],
    ]);
    const outcome = resolveImport(steps, (uuid) => choices.get(uuid));
    expect(outcome.toAdd).toEqual([
      { item: { uuid: 'n1', name: 'New' }, asNew: false },
      { item: { uuid: 'c1', name: 'Conflict 1' }, asNew: true },
    ]);
    expect(outcome.counts).toEqual({
      imported: 1,
      importedAsNew: 1,
      skipped: 1,
      upToDate: 1,
    });
  });

  it('skips a conflict with no choice, as each row starts on Skip', () => {
    const outcome = resolveImport(steps, () => undefined);
    expect(outcome.toAdd.map((add) => add.item.uuid)).toEqual(['n1']);
    expect(outcome.counts.skipped).toBe(2);
  });
});
