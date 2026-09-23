import { describe, expect, it } from 'vitest';
import { parseTeamsJson } from './teams';

describe('parseTeamsJson', () => {
  it('parses a well-formed array of team objects', () => {
    const json = JSON.stringify([
      { slug: 'salt-marsh-utd', name: 'Salt Marsh United', colour: '#039BE5', tier: 'A' },
    ]);
    expect(parseTeamsJson(json)).toEqual([
      { slug: 'salt-marsh-utd', name: 'Salt Marsh United', colour: '#039BE5', tier: 'A' },
    ]);
  });

  it('ignores unknown extra fields on an entry', () => {
    const json = JSON.stringify([
      { name: 'Northgate FC', colour: '#212121', tier: 'B', city: 'Northgate' },
    ]);
    expect(parseTeamsJson(json)).toEqual([
      { slug: '', name: 'Northgate FC', colour: '#212121', tier: 'B' },
    ]);
  });

  it('defaults a missing slug and colour to an empty string', () => {
    const json = JSON.stringify([{ name: 'Pinecrest Rovers', tier: 'C' }]);
    expect(parseTeamsJson(json)).toEqual([
      { slug: '', name: 'Pinecrest Rovers', colour: '', tier: 'C' },
    ]);
  });

  it('returns an empty array for an empty list', () => {
    expect(parseTeamsJson('[]')).toEqual([]);
  });

  it('throws when the text is not valid JSON', () => {
    expect(() => parseTeamsJson('{not json')).toThrow(/not valid JSON/);
  });

  it('throws when the top level is not an array', () => {
    expect(() => parseTeamsJson('{"name":"Team A","tier":"A"}')).toThrow(
      /must be an array/
    );
  });

  it('throws when an entry is missing a name', () => {
    expect(() => parseTeamsJson('[{"tier":"A"}]')).toThrow(/entry 1.*missing a name/);
  });

  it('throws when an entry has an invalid tier', () => {
    expect(() => parseTeamsJson('[{"name":"Team A","tier":"Z"}]')).toThrow(
      /entry 1.*invalid tier/
    );
  });

  it('throws when an entry is not an object', () => {
    expect(() => parseTeamsJson('["not an object"]')).toThrow(/entry 1.*not an object/);
  });
});
