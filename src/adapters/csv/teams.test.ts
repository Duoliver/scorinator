import { describe, expect, it } from 'vitest';
import { parseTeamsCsv, serializeTeamsCsv } from './teams';
import type { TeamListRecord } from '@/persistence/types';

describe('parseTeamsCsv', () => {
  it('parses a well-formed file with all four columns', () => {
    const csv = 'Slug,Name,Colour,Tier\nsalt-marsh-utd,Salt Marsh United,#039BE5,A';
    expect(parseTeamsCsv(csv)).toEqual([
      {
        slug: 'salt-marsh-utd',
        name: 'Salt Marsh United',
        colour: '#039BE5',
        tier: 'A',
      },
    ]);
  });

  it('does not depend on header order', () => {
    const csv = 'Tier,Name,Slug,Colour\nB,Redbrick Athletic,redbrick-ath,#E53935';
    expect(parseTeamsCsv(csv)).toEqual([
      { slug: 'redbrick-ath', name: 'Redbrick Athletic', colour: '#E53935', tier: 'B' },
    ]);
  });

  it('ignores an unknown extra column', () => {
    const csv =
      'Slug,Name,Colour,Tier,City\nnorthgate-fc,Northgate FC,#212121,B,Northgate';
    expect(parseTeamsCsv(csv)).toEqual([
      { slug: 'northgate-fc', name: 'Northgate FC', colour: '#212121', tier: 'B' },
    ]);
  });

  it('allows a blank Slug cell', () => {
    const csv = 'Slug,Name,Colour,Tier\n,Pinecrest Rovers,#2E7D32,C';
    expect(parseTeamsCsv(csv)).toEqual([
      { slug: '', name: 'Pinecrest Rovers', colour: '#2E7D32', tier: 'C' },
    ]);
  });

  it('throws when a required header is missing', () => {
    const csv = 'Slug,Colour,Tier\na,#fff,A';
    expect(() => parseTeamsCsv(csv)).toThrow(/Name/);
  });

  it('throws when a data row is missing a Name', () => {
    const csv = 'Slug,Name,Colour,Tier\na,,#fff,A';
    expect(() => parseTeamsCsv(csv)).toThrow(/row 2.*Name/);
  });

  it('throws when a data row is missing a Tier', () => {
    const csv = 'Slug,Name,Colour,Tier\na,Team A,#fff,';
    expect(() => parseTeamsCsv(csv)).toThrow(/row 2.*Tier/);
  });

  it('throws when a Tier value is invalid', () => {
    const csv = 'Slug,Name,Colour,Tier\na,Team A,#fff,Z';
    expect(() => parseTeamsCsv(csv)).toThrow(/invalid Tier/);
  });

  it('returns an empty array for a header-only file', () => {
    expect(parseTeamsCsv('Slug,Name,Colour,Tier')).toEqual([]);
  });
});

describe('parseTeamsCsv, the Location column (US-09.3)', () => {
  it('reads the Location column by its header, in any place and letter case', () => {
    const csv =
      'LOCATION,Slug,Name,Colour,Tier\n  Ashfield  ,ash-fc,Ashfield FC,#fff,C';
    expect(parseTeamsCsv(csv)[0].location).toBe('Ashfield');
  });

  it('gives no location field for a file with no Location column', () => {
    const csv = 'Slug,Name,Colour,Tier\nash-fc,Ashfield FC,#fff,C';
    expect(parseTeamsCsv(csv)[0]).not.toHaveProperty('location');
  });

  it('gives an empty location for an empty cell', () => {
    const csv = 'Slug,Name,Colour,Tier,Location\nash-fc,Ashfield FC,#fff,C,';
    expect(parseTeamsCsv(csv)[0].location).toBe('');
  });

  it('accepts 40 characters, and throws for 41 with the row number', () => {
    const row = (location: string): string =>
      `Slug,Name,Colour,Tier,Location\na,Team A,#fff,A,ok\nb,Team B,#fff,A,${location}`;
    expect(parseTeamsCsv(row('x'.repeat(40)))[1].location).toBe('x'.repeat(40));
    expect(() => parseTeamsCsv(row('x'.repeat(41)))).toThrow(
      'Team CSV row 3 has a Location over 40 characters.'
    );
  });
});

describe('parseTeamsCsv, the Trigrams column (US-09.6)', () => {
  it('reads the trigrams split by spaces, in order, and makes them uppercase', () => {
    const csv =
      'Slug,Name,Colour,Tier,trigrams\nash-fc,Ashfield FC,#fff,C,  ash   AFC a10 ';
    expect(parseTeamsCsv(csv)[0].trigrams).toEqual(['ASH', 'AFC', 'A10']);
  });

  it('gives no trigrams field for a file with no Trigrams column', () => {
    const csv = 'Slug,Name,Colour,Tier\nash-fc,Ashfield FC,#fff,C';
    expect(parseTeamsCsv(csv)[0]).not.toHaveProperty('trigrams');
  });

  it('gives an empty list for an empty cell', () => {
    const csv = 'Slug,Name,Colour,Tier,Trigrams\nash-fc,Ashfield FC,#fff,C,';
    expect(parseTeamsCsv(csv)[0].trigrams).toEqual([]);
  });

  it('throws for an invalid trigram, with the row number and the value', () => {
    const csv =
      'Slug,Name,Colour,Tier,Trigrams\na,Team A,#fff,A,\nb,Team B,#fff,A,ASH AS';
    expect(() => parseTeamsCsv(csv)).toThrow(
      'Team CSV row 3 has an invalid trigram "AS".'
    );
  });

  it('throws for a trigram that shows twice in one cell', () => {
    const csv = 'Slug,Name,Colour,Tier,Trigrams\na,Team A,#fff,A,ASH afc ash';
    expect(() => parseTeamsCsv(csv)).toThrow(
      'Team CSV row 2 has the trigram "ASH" twice.'
    );
  });

  it('accepts 5 trigrams, and throws for 6', () => {
    const five = 'Slug,Name,Colour,Tier,Trigrams\na,Team A,#fff,A,AAA BBB CCC DDD EEE';
    expect(parseTeamsCsv(five)[0].trigrams).toHaveLength(5);
    expect(() => parseTeamsCsv(`${five} FFF`)).toThrow(
      'Team CSV row 2 has 6 trigrams. The limit is 5.'
    );
  });
});

describe('serializeTeamsCsv', () => {
  it('quotes only the fields that need it', () => {
    const records: TeamListRecord[] = [
      { slug: 'a-fc', name: 'A, FC', colour: '#fff', tier: 'A' },
    ];
    expect(serializeTeamsCsv(records)).toBe(
      'Slug,Name,Colour,Tier,Location,Trigrams\na-fc,"A, FC",#fff,A,,'
    );
  });

  it('round-trips through parseTeamsCsv, including special characters', () => {
    const records: TeamListRecord[] = [
      {
        slug: 'salt-marsh-utd',
        name: 'Salt Marsh United',
        colour: '#039BE5',
        tier: 'A',
        location: 'Ashfield, North',
        trigrams: ['SMU', 'SAL'],
      },
      {
        slug: '',
        name: 'Say "Hi" FC, Ltd.',
        colour: '#000000',
        tier: 'F',
        location: '',
        trigrams: [],
      },
    ];
    expect(parseTeamsCsv(serializeTeamsCsv(records))).toEqual(records);
  });

  it('writes six columns, with the trigrams split by one space (US-09.3, US-09.6)', () => {
    const records: TeamListRecord[] = [
      {
        slug: 'ash-fc',
        name: 'Ashfield FC',
        colour: '#fff',
        tier: 'C',
        location: 'Ashfield',
        trigrams: ['ASH', 'AFC'],
      },
    ];
    expect(serializeTeamsCsv(records)).toBe(
      'Slug,Name,Colour,Tier,Location,Trigrams\nash-fc,Ashfield FC,#fff,C,Ashfield,ASH AFC'
    );
  });

  it('writes empty Location and Trigrams cells for a record without them', () => {
    const records: TeamListRecord[] = [
      { slug: 'a-fc', name: 'A FC', colour: '#fff', tier: 'A' },
    ];
    expect(serializeTeamsCsv(records)).toBe(
      'Slug,Name,Colour,Tier,Location,Trigrams\na-fc,A FC,#fff,A,,'
    );
  });
});

describe('parseTeamsCsv, the Slug check (Task 173)', () => {
  const row = (slug: string): string => `Slug,Name,Colour,Tier\n${slug},North FC,,B`;

  it('stops the import for a slug with a space, with the row number', () => {
    expect(() => parseTeamsCsv(`${row('north-fc')}\nnorth fc,North FC 2,,B`)).toThrow(
      'Team CSV row 3 has an invalid Slug "north fc". Use only letters, digits, and hyphens.'
    );
  });

  it('stops the import for another character', () => {
    expect(() => parseTeamsCsv(row('north_fc'))).toThrow(
      /row 2 has an invalid Slug "north_fc"/
    );
  });

  it('changes a valid slug to lower case', () => {
    expect(parseTeamsCsv(row('North-FC'))[0].slug).toBe('north-fc');
  });

  it('keeps an empty slug, so the import makes one from the name', () => {
    expect(parseTeamsCsv(row(''))[0].slug).toBe('');
  });
});
