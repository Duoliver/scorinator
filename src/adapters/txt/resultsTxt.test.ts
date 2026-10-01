import { describe, expect, it } from 'vitest';
import type { SavedLeague } from '@/adapters/json-io';
import { serializeResultsTxt, type ResultsTxtInput } from './resultsTxt';

const POINTS = { win: 3, draw: 1, loss: 0 };

// The input type is `readonly`, so the tests build a mutable twin of it to
// change a copy before each call.
type Mutable<T> = {
  -readonly [K in keyof T]: T[K] extends readonly (infer U)[] ? U[] : T[K];
};

// Three teams, two matchdays, one match played, one still to play, and a
// bye on each matchday. Team names differ in length on purpose, so the
// alignment is visible in the exact-string test below.
function partialLeague(): Mutable<ResultsTxtInput> {
  return {
    league: { name: 'Ash League', homeAdvantage: true, points: POINTS },
    teams: [
      { slug: 'ash', name: 'Ash Town' },
      { slug: 'north', name: 'Northgate FC' },
      { slug: 'salt', name: 'Salt Marsh United' },
    ],
    fixtures: [
      { matchday: 1, home: 'ash', away: 'north' },
      { matchday: 2, home: 'salt', away: 'ash' },
    ],
    byes: [
      { matchday: 1, team: 'salt' },
      { matchday: 2, team: 'north' },
    ],
    results: [{ matchday: 1, home: 'ash', away: 'north', homeGoals: 2, awayGoals: 1 }],
  };
}

function twoTeamLeague(homeGoals: number, awayGoals: number): Mutable<ResultsTxtInput> {
  return {
    league: { name: 'Duel', homeAdvantage: false, points: POINTS },
    teams: [
      { slug: 'a', name: 'Alpha' },
      { slug: 'b', name: 'Bravo' },
    ],
    fixtures: [{ matchday: 1, home: 'a', away: 'b' }],
    byes: [],
    results: [{ matchday: 1, home: 'a', away: 'b', homeGoals, awayGoals }],
  };
}

describe('serializeResultsTxt', () => {
  it('writes the whole summary for a partly played league', () => {
    const expected = [
      'Ash League',
      '',
      'Home advantage: on',
      'Points: win 3, draw 1, loss 0',
      'Matches played: 1 of 2',
      '',
      'STANDINGS',
      'Pos  Team               P  W  D  L  GF  GA  GD  Pts',
      '  1  Ash Town           1  1  0  0   2   1  +1    3',
      '  2  Salt Marsh United  0  0  0  0   0   0   0    0',
      '  3  Northgate FC       1  0  0  1   1   2  -1    0',
      '',
      'RESULTS',
      'Matchday 1',
      '           Ash Town  2 - 1  Northgate FC',
      '  Bye: Salt Marsh United',
      '',
      'Matchday 2',
      '  Salt Marsh United   vs    Ash Town',
      '  Bye: Northgate FC',
      '',
    ].join('\n');

    expect(serializeResultsTxt(partialLeague())).toBe(expected);
  });

  it('accepts a SavedLeague as it is', () => {
    const saved: SavedLeague = {
      formatVersion: 1,
      league: { name: 'Duel', homeAdvantage: false, points: POINTS },
      teams: [
        { slug: 'a', name: 'Alpha', colour: '#fff', tier: 'A', ovr: 85 },
        { slug: 'b', name: 'Bravo', colour: '#000', tier: 'B', ovr: 75 },
      ],
      fixtures: [{ matchday: 1, home: 'a', away: 'b' }],
      byes: [],
      results: [{ matchday: 1, home: 'a', away: 'b', homeGoals: 1, awayGoals: 0 }],
    };

    expect(serializeResultsTxt(saved)).toContain('Alpha  1 - 0  Bravo');
  });

  it('says the league is completed once every fixture has a result', () => {
    expect(serializeResultsTxt(twoTeamLeague(1, 0))).toContain(
      'Matches played: 1 of 1 (league completed)'
    );
  });

  it('does not say completed while a fixture is still unplayed', () => {
    expect(serializeResultsTxt(partialLeague())).not.toContain('completed');
  });

  it('shows "off" when home advantage is off', () => {
    expect(serializeResultsTxt(twoTeamLeague(1, 0))).toContain('Home advantage: off');
  });

  it('uses the points config of the league', () => {
    const input = twoTeamLeague(1, 0);
    input.league.points = { win: 2, draw: 1, loss: 0 };
    const text = serializeResultsTxt(input);

    expect(text).toContain('Points: win 2, draw 1, loss 0');
    expect(text).toMatch(/1 {2}Alpha {2}1 {2}1 {2}0 {2}0 {3}1 {3}0 {2}\+1 {4}2/);
  });

  it('shows a joint place on the first row only, and a dash on the rest', () => {
    const lines = serializeResultsTxt(twoTeamLeague(1, 1)).split('\n');
    const rows = lines.filter((line) => /^ +[1-9-] {2}(Alpha|Bravo)/.test(line));

    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatch(/^ {2}1 {2}Alpha/);
    expect(rows[1]).toMatch(/^ {2}- {2}Bravo/);
  });

  it('shows "Untitled league" for a blank name', () => {
    const input = twoTeamLeague(1, 0);
    input.league.name = '   ';

    expect(serializeResultsTxt(input).split('\n')[0]).toBe('Untitled league');
  });

  it('lists matchdays in ascending order, whatever the fixture order', () => {
    const input = partialLeague();
    input.fixtures.reverse();
    const text = serializeResultsTxt(input);

    expect(text.indexOf('Matchday 1')).toBeGreaterThan(-1);
    expect(text.indexOf('Matchday 1')).toBeLessThan(text.indexOf('Matchday 2'));
  });

  it('handles a league with no fixtures', () => {
    const input = twoTeamLeague(1, 0);
    input.fixtures = [];
    input.results = [];
    const text = serializeResultsTxt(input);

    expect(text).toContain('Matches played: 0 of 0');
    expect(text).not.toContain('completed');
    expect(text).toContain('No fixtures.');
  });

  it('ends with one newline, with no carriage return and no trailing spaces', () => {
    const text = serializeResultsTxt(partialLeague());

    expect(text.endsWith('\n')).toBe(true);
    expect(text.endsWith('\n\n')).toBe(false);
    expect(text).not.toContain('\r');
    for (const line of text.split('\n')) {
      expect(line).toBe(line.trimEnd());
    }
  });

  it('gives the same text for the same input, and leaves the input alone', () => {
    const input = partialLeague();
    const before = JSON.stringify(input);

    expect(serializeResultsTxt(input)).toBe(serializeResultsTxt(input));
    expect(JSON.stringify(input)).toBe(before);
  });

  it('throws a RangeError for a fixture that names an unknown team', () => {
    const input = partialLeague();
    input.fixtures.push({ matchday: 3, home: 'ghost', away: 'ash' });

    expect(() => serializeResultsTxt(input)).toThrow(RangeError);
  });

  it('throws a RangeError for a bye that names an unknown team', () => {
    const input = partialLeague();
    input.byes.push({ matchday: 3, team: 'ghost' });

    expect(() => serializeResultsTxt(input)).toThrow(RangeError);
  });

  it('throws a RangeError for a result that has no fixture', () => {
    const input = partialLeague();
    input.results.push({
      matchday: 2,
      home: 'north',
      away: 'salt',
      homeGoals: 0,
      awayGoals: 0,
    });

    expect(() => serializeResultsTxt(input)).toThrow(RangeError);
  });
});
