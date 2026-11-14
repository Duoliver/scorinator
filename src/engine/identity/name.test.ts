import { describe, expect, it } from 'vitest';
import { getNumberedName, pickJoinNames, type JoinNameTeam } from './name';

describe('getNumberedName (US-13.11, US-15.5, US-16.1, Task 208)', () => {
  it('keeps a name that is free', () => {
    expect(getNumberedName('Liga', ['Copa'])).toBe('Liga');
  });

  it('adds (2) to a taken name', () => {
    expect(getNumberedName('Liga', ['Liga'])).toBe('Liga (2)');
  });

  it('gives the first free number', () => {
    expect(getNumberedName('Liga', ['Liga', 'Liga (2)'])).toBe('Liga (3)');
    expect(getNumberedName('Liga', ['Liga', 'Liga (3)'])).toBe('Liga (2)');
  });

  it('counts up from the number in a taken name (choice 3)', () => {
    expect(getNumberedName('Liga (2)', ['Liga', 'Liga (2)'])).toBe('Liga (3)');
    expect(getNumberedName('Liga (2)', ['Liga (2)', 'Liga (3)'])).toBe('Liga (4)');
    expect(getNumberedName('Liga (2025)', ['Liga (2025)'])).toBe('Liga (2026)');
  });

  it('matches a name in any case, and with spaces at the two ends', () => {
    expect(getNumberedName('liga', [' LIGA '])).toBe('liga (2)');
    expect(getNumberedName('Liga', ['Liga', 'LIGA (2)'])).toBe('Liga (3)');
  });

  it('counts an accent: "Atletico" does not match "Atlético"', () => {
    expect(getNumberedName('Atletico', ['Atlético'])).toBe('Atletico');
  });
});

describe('pickJoinNames (US-13.4, Task 208)', () => {
  const team = (
    id: string,
    overrides: Partial<JoinNameTeam<string>> = {}
  ): JoinNameTeam<string> => ({
    id,
    name: 'Ashfield Rovers',
    location: '',
    ovr: 70,
    lot: 0,
    ...overrides,
  });

  const names = (
    taken: string[],
    teams: JoinNameTeam<string>[]
  ): Record<string, string> => Object.fromEntries(pickJoinNames(taken, teams));

  it('keeps each name that clashes with nothing', () => {
    expect(
      names(['Riverside FC'], [team('a'), team('b', { name: 'Porto Velho SC' })])
    ).toEqual({ a: 'Ashfield Rovers', b: 'Porto Velho SC' });
  });

  it('adds the Location of a joining team whose name a roster team has', () => {
    expect(names(['Ashfield Rovers'], [team('a', { location: 'Northtown' })])).toEqual({
      a: 'Ashfield Rovers (Northtown)',
    });
  });

  it('trims the Location', () => {
    expect(
      names(['Ashfield Rovers'], [team('a', { location: '  Northtown ' })])
    ).toEqual({
      a: 'Ashfield Rovers (Northtown)',
    });
  });

  it('gives the first free number to a team with no Location', () => {
    expect(names(['Ashfield Rovers'], [team('a')])).toEqual({
      a: 'Ashfield Rovers (2)',
    });
    expect(names(['Ashfield Rovers', 'Ashfield Rovers (2)'], [team('a')])).toEqual({
      a: 'Ashfield Rovers (3)',
    });
  });

  it('gives a number when the name with the Location is taken too (choice 5)', () => {
    expect(
      names(
        ['Ashfield Rovers', 'Ashfield Rovers (Northtown)'],
        [team('a', { location: 'Northtown' })]
      )
    ).toEqual({ a: 'Ashfield Rovers (2)' });
  });

  it('matches a roster name in any case, and with spaces at the two ends', () => {
    expect(names([' ashfield ROVERS'], [team('a')])).toEqual({
      a: 'Ashfield Rovers (2)',
    });
  });

  it('lets the higher OVR keep the name when two joining teams clash', () => {
    expect(
      names(
        [],
        [
          team('low', { ovr: 62, location: 'Westbury' }),
          team('high', { ovr: 86, location: 'Ashfield' }),
        ]
      )
    ).toEqual({ high: 'Ashfield Rovers', low: 'Ashfield Rovers (Westbury)' });
  });

  it('lets the lower lot keep the name at the same OVR', () => {
    expect(
      names(
        [],
        [
          team('second', { lot: 9, location: 'B' }),
          team('first', { lot: 1, location: 'A' }),
        ]
      )
    ).toEqual({ first: 'Ashfield Rovers', second: 'Ashfield Rovers (B)' });
  });

  it('counts the names given in the same join', () => {
    expect(
      names(['Ashfield Rovers'], [team('a', { ovr: 80 }), team('b', { ovr: 60 })])
    ).toEqual({ a: 'Ashfield Rovers (2)', b: 'Ashfield Rovers (3)' });
  });

  it('never changes a roster name: the roster teams joined first', () => {
    const result = pickJoinNames(['Ashfield Rovers'], [team('a', { ovr: 99 })]);
    expect(result.get('a')).toBe('Ashfield Rovers (2)');
    expect(result.size).toBe(1);
  });
});
