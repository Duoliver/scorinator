import { describe, expect, it } from 'vitest';
import { parseLeague, serializeLeague } from './league';
import { SAVE_FORMAT_VERSION, type SavedLeague } from './types';

function buildLeague(): SavedLeague {
  return {
    formatVersion: SAVE_FORMAT_VERSION,
    league: { name: 'Coastal Premier', homeAdvantage: true, points: { win: 3, draw: 1, loss: 0 } },
    teams: [
      { slug: 'salt-marsh-united', name: 'Salt Marsh United', colour: '#1155cc', tier: 'B', ovr: 74 },
      { slug: 'harborview-sc', name: 'Harborview SC', colour: '#cc4411', tier: 'C', ovr: 63 },
    ],
    fixtures: [
      { matchday: 1, home: 'salt-marsh-united', away: 'harborview-sc' },
      { matchday: 2, home: 'harborview-sc', away: 'salt-marsh-united' },
    ],
    byes: [],
    results: [
      { matchday: 1, home: 'salt-marsh-united', away: 'harborview-sc', homeGoals: 2, awayGoals: 1 },
    ],
  };
}

describe('serializeLeague / parseLeague', () => {
  it('round-trips a league unchanged', () => {
    const league = buildLeague();
    const parsed = parseLeague(serializeLeague(league));
    expect(parsed).toEqual(league);
  });

  it('round-trips a league with an unplayed fixture (no matching result)', () => {
    const league = buildLeague();
    league.results = [];
    const parsed = parseLeague(serializeLeague(league));
    expect(parsed.results).toEqual([]);
    expect(parsed.fixtures).toHaveLength(2);
  });

  it('pretty-prints the output', () => {
    const text = serializeLeague(buildLeague());
    expect(text).toContain('\n  "formatVersion"');
  });

  it('throws on malformed JSON', () => {
    expect(() => parseLeague('{not json')).toThrow('Save file is not valid JSON.');
  });

  it('throws when the top level is not an object', () => {
    expect(() => parseLeague('[1, 2, 3]')).toThrow(/does not contain a JSON object/);
  });

  it('throws on a missing or mismatched format version', () => {
    const league = buildLeague();
    const text = JSON.stringify({ ...league, formatVersion: 99 });
    expect(() => parseLeague(text)).toThrow(/unsupported save format version/);
  });

  it('throws when the league name is missing', () => {
    const league = buildLeague();
    const text = JSON.stringify({ ...league, league: { ...league.league, name: '' } });
    expect(() => parseLeague(text)).toThrow(/league is missing a name/);
  });

  it('throws on an invalid team tier', () => {
    const league = buildLeague();
    league.teams[0].tier = 'X' as SavedLeague['teams'][number]['tier'];
    expect(() => parseLeague(JSON.stringify(league))).toThrow(/invalid tier/);
  });

  it('throws on a blank team slug', () => {
    const league = buildLeague();
    league.teams[0].slug = '';
    expect(() => parseLeague(JSON.stringify(league))).toThrow(/missing a slug/);
  });

  it('throws when fixtures is not a list', () => {
    const league = buildLeague();
    const text = JSON.stringify({ ...league, fixtures: 'nope' });
    expect(() => parseLeague(text)).toThrow(/"fixtures" is missing or not a list/);
  });

  it('throws on a negative result score', () => {
    const league = buildLeague();
    league.results[0].homeGoals = -1;
    expect(() => parseLeague(JSON.stringify(league))).toThrow(/invalid home score/);
  });
});
