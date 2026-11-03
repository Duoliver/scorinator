import { describe, expect, it } from 'vitest';
import { createSeededRng } from '@/engine/rng';
import { fixedLot, uuidV4, type RandomBytes } from './index';

function seededBytes(seed: number): RandomBytes {
  const rng = createSeededRng(seed);
  return (length) => Uint8Array.from({ length }, () => Math.floor(rng() * 256));
}

describe('fixedLot', () => {
  const league = '9f1c2d3e-4b5a-4c6d-8e7f-0a1b2c3d4e5f';
  const team = '11111111-2222-4333-8444-555555555555';

  it('gives the same number for the same two strings', () => {
    expect(fixedLot(league, team)).toBe(fixedLot(league, team));
  });

  it('gives a whole number from 0 to 2^32 - 1', () => {
    const lot = fixedLot(league, team);
    expect(Number.isInteger(lot)).toBe(true);
    expect(lot).toBeGreaterThanOrEqual(0);
    expect(lot).toBeLessThan(2 ** 32);
  });

  it('gives a different number for another league or another team', () => {
    expect(fixedLot(league, team)).not.toBe(fixedLot(team, league));
    expect(fixedLot(league, team)).not.toBe(fixedLot(league, `${team}x`));
  });

  it('orders two fixed teams at random across 2,000 leagues: each goes first in 45% to 55%', () => {
    const rng = createSeededRng(1);
    const teamA = uuidV4(seededBytes(101));
    const teamB = uuidV4(seededBytes(202));
    let aFirst = 0;
    for (let i = 0; i < 2000; i++) {
      const leagueId = uuidV4(seededBytes(Math.floor(rng() * 2 ** 31)));
      if (fixedLot(leagueId, teamA) < fixedLot(leagueId, teamB)) aFirst++;
    }
    expect(aFirst / 2000).toBeGreaterThanOrEqual(0.45);
    expect(aFirst / 2000).toBeLessThanOrEqual(0.55);
  });

  it('orders near-equal ids at random too: each goes first in 45% to 55% of 2,000 leagues', () => {
    let aFirst = 0;
    for (let i = 0; i < 2000; i++) {
      if (fixedLot(`league-${i}`, 'team-1') < fixedLot(`league-${i}`, 'team-2'))
        aFirst++;
    }
    expect(aFirst / 2000).toBeGreaterThanOrEqual(0.45);
    expect(aFirst / 2000).toBeLessThanOrEqual(0.55);
  });
});
