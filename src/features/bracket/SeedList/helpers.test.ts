import { describe, expect, it } from 'vitest';
import type { StandingsRow } from '@/engine/standings';
import {
  BYE_HELP_TEXT,
  buildSeedRows,
  describeByes,
  ordinal,
  seedTagsOf,
  toggleBye,
} from './helpers';

const rowsOf = (...teams: string[]): StandingsRow<string>[] =>
  teams.map((team) => ({ team }) as StandingsRow<string>);
const lookup = (id: string): { name: string; colour: string; trigram: string } => ({
  name: id.toUpperCase(),
  colour: '#000000',
  trigram: '',
});

describe('ordinal', () => {
  it.each([
    [1, '1st'],
    [2, '2nd'],
    [3, '3rd'],
    [4, '4th'],
    [11, '11th'],
    [12, '12th'],
    [13, '13th'],
    [21, '21st'],
    [22, '22nd'],
    [23, '23rd'],
    [111, '111th'],
  ])('%i is "%s"', (n, text) => {
    expect(ordinal(n)).toBe(text);
  });
});

describe('seedTagsOf (US-04.2, Task 142 choice 2)', () => {
  it('a round robin gives the place as an ordinal', () => {
    expect(seedTagsOf([rowsOf('a', 'b', 'c')], 'round-robin')).toEqual(
      new Map([
        ['a', '1st'],
        ['b', '2nd'],
        ['c', '3rd'],
      ])
    );
  });

  it('Groups give the group letter and the place', () => {
    expect(
      seedTagsOf([rowsOf('a', 'b'), rowsOf('c', 'd'), rowsOf('e', 'f', 'g')], 'groups')
    ).toEqual(
      new Map([
        ['a', 'A1'],
        ['b', 'A2'],
        ['c', 'B1'],
        ['d', 'B2'],
        ['e', 'C1'],
        ['f', 'C2'],
        ['g', 'C3'],
      ])
    );
  });
});

describe('describeByes (US-04.10)', () => {
  it('gives the help text and the count when the bracket has byes', () => {
    expect(describeByes(6, 2, 1)).toEqual({
      text: BYE_HELP_TEXT,
      count: '1 / 2 byes assigned',
    });
    expect(BYE_HELP_TEXT).toBe(
      'Top seeds get a bye by default. Star any seed to grant it a bye instead — first-round only.'
    );
  });

  it('gives the no-byes text and no count for a power of 2', () => {
    expect(describeByes(8, 0, 0)).toEqual({
      text: '8 qualifiers fill the bracket exactly — no byes needed.',
      count: undefined,
    });
  });
});

describe('buildSeedRows', () => {
  const tags = new Map([
    ['a', 'A1'],
    ['b', 'B1'],
  ]);

  it('gives each seed its number, name, tag, and star state', () => {
    expect(buildSeedRows(['a', 'b', 'c'], ['a'], 1, tags, lookup)).toEqual([
      {
        key: 'a',
        seed: 1,
        name: 'A',
        colour: '#000000',
        tag: 'A1',
        hasBye: true,
        starDisabled: false,
      },
      {
        key: 'b',
        seed: 2,
        name: 'B',
        colour: '#000000',
        tag: 'B1',
        hasBye: false,
        starDisabled: true,
      },
      {
        key: 'c',
        seed: 3,
        name: 'C',
        colour: '#000000',
        tag: '',
        hasBye: false,
        starDisabled: true,
      },
    ]);
  });

  it('enables the empty stars while a bye is free', () => {
    const rows = buildSeedRows(['a', 'b', 'c', 'd', 'e', 'f'], ['a'], 2, tags, lookup);
    expect(rows.map((row) => row.starDisabled)).toEqual([
      false,
      false,
      false,
      false,
      false,
      false,
    ]);
  });

  it('disables every star with no byes', () => {
    const rows = buildSeedRows(['a', 'b'], [], 0, tags, lookup);
    expect(rows.every((row) => row.starDisabled)).toBe(true);
  });
});

describe('toggleBye', () => {
  it('adds a team with no bye, and removes a team with one', () => {
    expect(toggleBye(['a'], 'c')).toEqual(['a', 'c']);
    expect(toggleBye(['a', 'c'], 'a')).toEqual(['c']);
  });
});
