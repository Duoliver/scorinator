import { describe, expect, it } from 'vitest';
import { parseSlugList, serializeSlugList } from './index';

/** The slugs of a file, in order: the level of each line does not count. */
const slugsOf = (text: string): string[] =>
  parseSlugList(text).entries.map((entry) => entry.slug);

describe('parseSlugList (US-08.7)', () => {
  it('gives one slug for each line, in file order', () => {
    expect(slugsOf('salt-marsh-united\nash-town\nnorthgate-fc')).toEqual([
      'salt-marsh-united',
      'ash-town',
      'northgate-fc',
    ]);
  });

  it('trims each line, and skips blank lines', () => {
    expect(slugsOf('  ash-town  \n\n   \n\tnorthgate-fc\n')).toEqual([
      'ash-town',
      'northgate-fc',
    ]);
  });

  it('skips a line that starts with # after the trim', () => {
    expect(slugsOf('# my roster\nash-town\n   # a note\nnorthgate-fc')).toEqual([
      'ash-town',
      'northgate-fc',
    ]);
  });

  it('skips the comment line of the US-10.5 export', () => {
    const text = '# Coastal Premier — final ranking, 2026-10-28\nash-town\n';
    expect(slugsOf(text)).toEqual(['ash-town']);
  });

  it('accepts \\n, \\r\\n, and \\r line ends', () => {
    expect(slugsOf('a-fc\r\nb-fc\rc-fc\nd-fc')).toEqual([
      'a-fc',
      'b-fc',
      'c-fc',
      'd-fc',
    ]);
  });

  it('skips a byte order mark at the start of the file', () => {
    expect(slugsOf('﻿ash-town\nnorthgate-fc')).toEqual(['ash-town', 'northgate-fc']);
  });

  it('keeps the case and the duplicates of the file (choices 1 and 2)', () => {
    expect(slugsOf('Ash-Town\nash-town\nASH-TOWN')).toEqual([
      'Ash-Town',
      'ash-town',
      'ASH-TOWN',
    ]);
  });

  it('accepts the letters, the digits, and the hyphen', () => {
    expect(slugsOf('1-fc-koln-2\nAZaz09-')).toEqual(['1-fc-koln-2', 'AZaz09-']);
  });

  it('gives an empty list for a file with no slug', () => {
    expect(slugsOf('')).toEqual([]);
    expect(slugsOf('\n  \n# only a comment\n')).toEqual([]);
  });

  it('throws for a line with three parts, with the line number and the rule', () => {
    expect(() => parseSlugList('ash-town\nnorth fc +1')).toThrow(
      'Slug list line 2, "north fc +1", is not a slug. Use only letters, digits, and hyphens, with no spaces or other characters.'
    );
  });

  it('counts the blank lines and the comments in the line number', () => {
    expect(() => parseSlugList('# roster\n\nash-town\n\nnorth_fc')).toThrow(
      /^Slug list line 5, "north_fc", is not a slug\./
    );
  });

  it('throws for an accent, a symbol, and a comment at the end of a line (choice 4)', () => {
    for (const line of ['évora', 'ash.town', 'ash/town', 'ash # note']) {
      expect(() => parseSlugList(line)).toThrow(
        `Slug list line 1, "${line}", is not a slug.`
      );
    }
  });

  it('names the trimmed line in the error', () => {
    expect(() => parseSlugList('   north fc +1   ')).toThrow('line 1, "north fc +1",');
  });

  it('throws for a bad slug with a level', () => {
    expect(() => parseSlugList('évora +1')).toThrow(
      'Slug list line 1, "évora +1", is not a slug.'
    );
  });
});

describe('parseSlugList with the condition level (US-14.4, Task 228)', () => {
  it('reads the level after the slug', () => {
    expect(parseSlugList('north-fc +1\nsouth-fc -2\neast-fc 0').entries).toEqual([
      { slug: 'north-fc', level: 1 },
      { slug: 'south-fc', level: -2 },
      { slug: 'east-fc', level: 0 },
    ]);
  });

  it('reads a line with no level as level 0, so an old file stays valid', () => {
    expect(parseSlugList('north-fc\nsouth-fc +2')).toEqual({
      entries: [
        { slug: 'north-fc', level: 0 },
        { slug: 'south-fc', level: 2 },
      ],
      badLevels: [],
    });
  });

  it('reads 1 and 2 with no plus, and spaces or tabs between the parts (choice 1)', () => {
    expect(parseSlugList('a-fc 1\nb-fc\t2\nc-fc    -1').entries).toEqual([
      { slug: 'a-fc', level: 1 },
      { slug: 'b-fc', level: 2 },
      { slug: 'c-fc', level: -1 },
    ]);
  });

  it('reads -0 and +0 as level 0', () => {
    const levels = parseSlugList('a-fc -0\nb-fc +0').entries.map((e) => e.level);
    expect(levels).toEqual([0, 0]);
    expect(Object.is(levels[0], 0)).toBe(true);
  });

  it('gives level 0 to a line with a bad level, and reports the line (choice 3)', () => {
    const file = parseSlugList('# list\nnorth-fc +3\nsouth-fc x\nnorth fc\neast-fc +1');
    expect(file.entries).toEqual([
      { slug: 'north-fc', level: 0 },
      { slug: 'south-fc', level: 0 },
      { slug: 'north', level: 0 },
      { slug: 'east-fc', level: 1 },
    ]);
    expect(file.badLevels).toEqual([
      { line: 2, text: 'north-fc +3' },
      { line: 3, text: 'south-fc x' },
      { line: 4, text: 'north fc' },
    ]);
  });

  it('reports a level of 1.5 and of ++1 as bad', () => {
    expect(parseSlugList('a-fc 1.5\nb-fc ++1').badLevels).toEqual([
      { line: 1, text: 'a-fc 1.5' },
      { line: 2, text: 'b-fc ++1' },
    ]);
  });
});

describe('serializeSlugList (US-10.5, Task 148, US-14.4)', () => {
  it('writes the comment line, then the slug and the level on each line', () => {
    expect(
      serializeSlugList({
        leagueName: 'Coastal Premier',
        date: '2026-10-28',
        teams: [
          { slug: 'salt-marsh-united', level: 1 },
          { slug: 'harborview-sc', level: 0 },
          { slug: 'old-town', level: -2 },
        ],
      })
    ).toBe(
      '# Coastal Premier — final ranking, 2026-10-28\nsalt-marsh-united +1\nharborview-sc 0\nold-town -2\n'
    );
  });

  it('writes "Untitled league" for a blank name', () => {
    expect(serializeSlugList({ leagueName: ' ', date: '2026-10-28', teams: [] })).toBe(
      '# Untitled league — final ranking, 2026-10-28\n'
    );
  });

  it('gives a file that parseSlugList reads back as the same slugs and levels', () => {
    const teams = [
      { slug: 'c', level: 2 },
      { slug: 'team-2', level: 0 },
      { slug: 'a-b-c', level: -1 },
    ] as const;
    expect(
      parseSlugList(serializeSlugList({ leagueName: 'L', date: '2026-11-04', teams }))
    ).toEqual({ entries: teams, badLevels: [] });
  });
});
