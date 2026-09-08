import { describe, expect, it } from 'vitest';
import { parseTeamsCsv, serializeTeamsCsv } from './teams';
import type { TeamCsvRecord } from './types';

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

describe('serializeTeamsCsv', () => {
  it('quotes only the fields that need it', () => {
    const records: TeamCsvRecord[] = [
      { slug: 'a-fc', name: 'A, FC', colour: '#fff', tier: 'A' },
    ];
    expect(serializeTeamsCsv(records)).toBe(
      'Slug,Name,Colour,Tier\na-fc,"A, FC",#fff,A'
    );
  });

  it('round-trips through parseTeamsCsv, including special characters', () => {
    const records: TeamCsvRecord[] = [
      {
        slug: 'salt-marsh-utd',
        name: 'Salt Marsh United',
        colour: '#039BE5',
        tier: 'A',
      },
      { slug: '', name: 'Say "Hi" FC, Ltd.', colour: '#000000', tier: 'F' },
    ];
    expect(parseTeamsCsv(serializeTeamsCsv(records))).toEqual(records);
  });
});
