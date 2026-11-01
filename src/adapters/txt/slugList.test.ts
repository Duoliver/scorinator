import { describe, expect, it } from 'vitest';
import { parseSlugList } from './index';

describe('parseSlugList (US-08.7)', () => {
  it('gives one slug for each line, in file order', () => {
    expect(parseSlugList('salt-marsh-united\nash-town\nnorthgate-fc')).toEqual([
      'salt-marsh-united',
      'ash-town',
      'northgate-fc',
    ]);
  });

  it('trims each line, and skips blank lines', () => {
    expect(parseSlugList('  ash-town  \n\n   \n\tnorthgate-fc\n')).toEqual([
      'ash-town',
      'northgate-fc',
    ]);
  });

  it('skips a line that starts with # after the trim', () => {
    expect(parseSlugList('# my roster\nash-town\n   # a note\nnorthgate-fc')).toEqual([
      'ash-town',
      'northgate-fc',
    ]);
  });

  it('skips the comment line of the US-10.5 export', () => {
    const text = '# Coastal Premier — final ranking, 2026-10-28\nash-town\n';
    expect(parseSlugList(text)).toEqual(['ash-town']);
  });

  it('accepts \\n, \\r\\n, and \\r line ends', () => {
    expect(parseSlugList('a-fc\r\nb-fc\rc-fc\nd-fc')).toEqual([
      'a-fc',
      'b-fc',
      'c-fc',
      'd-fc',
    ]);
  });

  it('skips a byte order mark at the start of the file', () => {
    expect(parseSlugList('﻿ash-town\nnorthgate-fc')).toEqual([
      'ash-town',
      'northgate-fc',
    ]);
  });

  it('keeps the case and the duplicates of the file (choices 1 and 2)', () => {
    expect(parseSlugList('Ash-Town\nash-town\nASH-TOWN')).toEqual([
      'Ash-Town',
      'ash-town',
      'ASH-TOWN',
    ]);
  });

  it('accepts the letters, the digits, and the hyphen', () => {
    expect(parseSlugList('1-fc-koln-2\nAZaz09-')).toEqual(['1-fc-koln-2', 'AZaz09-']);
  });

  it('gives an empty list for a file with no slug', () => {
    expect(parseSlugList('')).toEqual([]);
    expect(parseSlugList('\n  \n# only a comment\n')).toEqual([]);
  });

  it('throws for a line with a space, with the line number and the rule', () => {
    expect(() => parseSlugList('ash-town\nnorth fc')).toThrow(
      'Slug list line 2, "north fc", is not a slug. Use only letters, digits, and hyphens, with no spaces or other characters.'
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
    expect(() => parseSlugList('   north fc   ')).toThrow('line 1, "north fc",');
  });
});
