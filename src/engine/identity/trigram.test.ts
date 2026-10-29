import { describe, expect, it } from 'vitest';
import type { Tier } from '@/engine/tier-ovr';
import {
  isTrigram,
  MAX_TRIGRAMS,
  normalizeTrigram,
  parseTrigramList,
  pickTrigrams,
  trigramFromName,
  type TrigramPickTeam,
} from './trigram';

describe('trigramFromName', () => {
  it('takes the first three letters or digits, uppercase', () => {
    expect(trigramFromName('Ashfield Rovers')).toBe('ASH');
    expect(trigramFromName('1. FC Köln')).toBe('1FC');
    expect(trigramFromName('salt marsh')).toBe('SAL');
  });

  it('counts a letter with an accent as its base letter, and skips symbols', () => {
    expect(trigramFromName('Évora')).toBe('EVO');
    expect(trigramFromName("A.F.C. O'Neill")).toBe('AFC');
  });

  it('gives X for each missing place', () => {
    expect(trigramFromName('FC')).toBe('FCX');
    expect(trigramFromName('Z')).toBe('ZXX');
    expect(trigramFromName('!!!')).toBe('XXX');
  });
});

describe('isTrigram and normalizeTrigram', () => {
  it('accepts exactly 3 characters of A to Z or 0 to 9', () => {
    expect(isTrigram('ASH')).toBe(true);
    expect(isTrigram('AS2')).toBe(true);
    expect(isTrigram('123')).toBe(true);
  });

  it('rejects a lowercase letter, another length, or another character', () => {
    for (const text of ['ash', 'AS', 'ASHF', 'A-H', 'ÉVO', '', 'A H']) {
      expect(isTrigram(text)).toBe(false);
    }
  });

  it('makes a typed letter uppercase, and trims spaces', () => {
    expect(normalizeTrigram(' ash ')).toBe('ASH');
    expect(normalizeTrigram('aS2')).toBe('AS2');
  });

  it('gives null for a text that is no trigram, in lowercase or in uppercase', () => {
    for (const text of ['as', 'a-h', 'ashf', 'AS', 'A-H', 'ASHF', 'ÉVO', '']) {
      expect(normalizeTrigram(text)).toBeNull();
    }
  });
});

describe('parseTrigramList', () => {
  it('splits by spaces, makes each trigram uppercase, and keeps the order', () => {
    expect(parseTrigramList('ash  afc atn')).toEqual({
      ok: true,
      trigrams: ['ASH', 'AFC', 'ATN'],
    });
  });

  it('gives an empty list for an empty or blank text', () => {
    expect(parseTrigramList('')).toEqual({ ok: true, trigrams: [] });
    expect(parseTrigramList('   ')).toEqual({ ok: true, trigrams: [] });
  });

  it('gives the first bad trigram', () => {
    expect(parseTrigramList('ASH A-H AS')).toEqual({
      ok: false,
      problem: { kind: 'format', value: 'A-H' },
    });
  });

  it('gives the first duplicate, with no regard to case', () => {
    expect(parseTrigramList('ASH AFC ash')).toEqual({
      ok: false,
      problem: { kind: 'duplicate', value: 'ASH' },
    });
  });

  it(`allows ${MAX_TRIGRAMS} trigrams, and gives the count for more`, () => {
    expect(parseTrigramList('AAA BBB CCC DDD EEE')).toEqual({
      ok: true,
      trigrams: ['AAA', 'BBB', 'CCC', 'DDD', 'EEE'],
    });
    expect(parseTrigramList('AAA BBB CCC DDD EEE FFF')).toEqual({
      ok: false,
      problem: { kind: 'too-many', count: 6 },
    });
  });
});

describe('pickTrigrams', () => {
  const team = (
    id: string,
    overrides: Partial<TrigramPickTeam<string>> = {}
  ): TrigramPickTeam<string> => ({
    id,
    name: 'Ashfield',
    tier: 'C' as Tier,
    ovr: 60,
    trigrams: ['ASH'],
    lot: 0,
    ...overrides,
  });

  const picked = (teams: TrigramPickTeam<string>[]): Record<string, string> =>
    Object.fromEntries(
      [...pickTrigrams(teams)].map(([id, pick]) => [id, pick.trigram])
    );

  it('gives each team the first trigram of its list when nothing clashes', () => {
    expect(
      picked([
        team('a', { trigrams: ['ASH', 'AFC'] }),
        team('h', { trigrams: ['HAR'] }),
      ])
    ).toEqual({ a: 'ASH', h: 'HAR' });
  });

  it('uses the trigram made from the name for an empty list', () => {
    expect(picked([team('s', { name: 'Salt Marsh', trigrams: [] })])).toEqual({
      s: 'SAL',
    });
  });

  it('lets the higher Tier pick first', () => {
    const result = picked([
      team('low', { tier: 'C', trigrams: ['ASH', 'AFC'] }),
      team('high', { tier: 'A', trigrams: ['ASH', 'ATN'] }),
    ]);
    expect(result).toEqual({ high: 'ASH', low: 'AFC' });
  });

  it('lets the higher OVR pick first in the same Tier', () => {
    const result = picked([
      team('weak', { ovr: 61, trigrams: ['ASH', 'AFC'] }),
      team('strong', { ovr: 68, trigrams: ['ASH', 'ATN'] }),
    ]);
    expect(result).toEqual({ strong: 'ASH', weak: 'AFC' });
  });

  it('lets the lower lot pick first for the same Tier and OVR', () => {
    const result = picked([
      team('second', { lot: 7, trigrams: ['ASH', 'AFC'] }),
      team('first', { lot: 3, trigrams: ['ASH', 'ATN'] }),
    ]);
    expect(result).toEqual({ first: 'ASH', second: 'AFC' });
  });

  it('takes a fixed trigram first, before a team with a higher Tier', () => {
    const result = picked([
      team('top', { tier: 'S', trigrams: ['ASH', 'ATN'] }),
      team('fixed', { tier: 'F', trigrams: ['AFC'], fixed: 'ASH' }),
    ]);
    expect(result).toEqual({ fixed: 'ASH', top: 'ATN' });
  });

  it('gives the digit fallback, and flags it, when no trigram of the team is free', () => {
    const result = pickTrigrams([
      team('a', { tier: 'A' }),
      team('b', { tier: 'B' }),
      team('c', { tier: 'C' }),
    ]);
    expect(result.get('a')).toEqual({ trigram: 'ASH', fallback: false });
    expect(result.get('b')).toEqual({ trigram: 'AS2', fallback: true });
    expect(result.get('c')).toEqual({ trigram: 'AS3', fallback: true });
  });

  it('skips a taken digit, from 2 to 9', () => {
    const result = picked([
      team('as2', { tier: 'S', trigrams: ['AS2'] }),
      team('a', { tier: 'A' }),
      team('b', { tier: 'B' }),
    ]);
    expect(result).toEqual({ as2: 'AS2', a: 'ASH', b: 'AS3' });
  });

  it('tries the next trigrams of the list, then two digits, when 2 to 9 are taken', () => {
    // Top-Tier teams that hold ASH, AS2 to AS9, and BBB.
    const holders = [
      'ASH',
      'AS2',
      'AS3',
      'AS4',
      'AS5',
      'AS6',
      'AS7',
      'AS8',
      'AS9',
      'BBB',
    ].map((code, i) => team(`h${i}`, { tier: 'S', lot: i, trigrams: [code] }));
    const next = pickTrigrams([...holders, team('next', { trigrams: ['ASH', 'BBB'] })]);
    expect(next.get('next')).toEqual({ trigram: 'BB2', fallback: true });

    const moreHolders = ['BB2', 'BB3', 'BB4', 'BB5', 'BB6', 'BB7', 'BB8', 'BB9'].map(
      (code, i) => team(`b${i}`, { tier: 'S', lot: 100 + i, trigrams: [code] })
    );
    const last = pickTrigrams([
      ...holders,
      ...moreHolders,
      team('last', { trigrams: ['ASH', 'BBB'] }),
    ]);
    expect(last.get('last')).toEqual({ trigram: 'A10', fallback: true });
  });

  it('gives each team a trigram that no other team has', () => {
    const teams = Array.from({ length: 12 }, (_, i) =>
      team(`t${i}`, { lot: i, ovr: 60 + (i % 3) })
    );
    const codes = Object.values(picked(teams));
    expect(new Set(codes).size).toBe(codes.length);
  });

  it('gives the same result for the same input, in any input order', () => {
    const teams = [
      team('a', { tier: 'B', ovr: 72, lot: 2, trigrams: ['ASH', 'AFC'] }),
      team('b', { tier: 'B', ovr: 72, lot: 1, trigrams: ['ASH'] }),
      team('c', { tier: 'A', ovr: 80, lot: 3, trigrams: ['AFC', 'ASH'] }),
    ];
    expect(picked(teams)).toEqual(picked([...teams].reverse()));
    expect(picked(teams)).toEqual({ c: 'AFC', b: 'ASH', a: 'AS2' });
  });

  it('throws for two fixed trigrams that are the same', () => {
    expect(() =>
      pickTrigrams([team('a', { fixed: 'ASH' }), team('b', { fixed: 'ash' })])
    ).toThrow(RangeError);
  });

  it('throws for a fixed trigram with a bad format', () => {
    expect(() => pickTrigrams([team('a', { fixed: 'A-H' })])).toThrow(RangeError);
  });
});
