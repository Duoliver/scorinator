import { describe, expect, it } from 'vitest';
import { isMvp1File } from './index';

describe('isMvp1File (US-10.3)', () => {
  it('finds an MVP1 league save file', () => {
    const save = {
      formatVersion: 1,
      league: {},
      teams: [],
      fixtures: [],
      byes: [],
      results: [],
    };
    expect(isMvp1File(JSON.stringify(save))).toBe(true);
  });

  it('finds an MVP1 teams JSON, a plain list', () => {
    expect(isMvp1File(JSON.stringify([{ name: 'Harborview SC', tier: 'C' }]))).toBe(
      true
    );
    expect(isMvp1File('[]')).toBe(true);
  });

  it('does not take an MVP2 file for an MVP1 file', () => {
    expect(isMvp1File(JSON.stringify({ kind: 'manifest', formatVersion: 2 }))).toBe(
      false
    );
    expect(isMvp1File(JSON.stringify({ kind: 'wrapper', formatVersion: 2 }))).toBe(
      false
    );
  });

  it('does not take a version 1 object with no league and no teams for an MVP1 file', () => {
    expect(isMvp1File(JSON.stringify({ formatVersion: 1 }))).toBe(false);
  });

  it('is false for a text that is not JSON, and for other JSON values', () => {
    expect(isMvp1File('{ not json')).toBe(false);
    expect(isMvp1File('"text"')).toBe(false);
    expect(isMvp1File('null')).toBe(false);
  });
});
