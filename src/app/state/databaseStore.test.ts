import { describe, expect, it } from 'vitest';
import { SEASON, seasonWrapper, testUuid } from '@/test/databaseRecords';
import { requireOpenSeason, requireRunningOpenSeason } from './databaseStore';

const open = seasonWrapper();
const finished = { ...open, content: { ...open.content, finished: true } };

describe('requireOpenSeason (Task 252)', () => {
  it('gives the open Season', () => {
    expect(requireOpenSeason({ seasons: { [SEASON]: finished } }, SEASON)).toBe(
      finished
    );
  });

  it('throws a RangeError for a Season that is not open', () => {
    expect(() => requireOpenSeason({ seasons: {} }, testUuid(9))).toThrow(
      `No open Season has the UUID ${testUuid(9)}.`
    );
  });
});

describe('requireRunningOpenSeason (Task 252)', () => {
  it('gives the open Season while it runs', () => {
    expect(requireRunningOpenSeason({ seasons: { [SEASON]: open } }, SEASON)).toBe(
      open
    );
  });

  it('throws for a finished Season (US-13.9)', () => {
    expect(() =>
      requireRunningOpenSeason({ seasons: { [SEASON]: finished } }, SEASON)
    ).toThrow('The Season "Liga Norte" (2026-27) is finished. Reopen it to change it.');
  });

  it('throws a RangeError for a Season that is not open', () => {
    expect(() => requireRunningOpenSeason({ seasons: {} }, SEASON)).toThrow(RangeError);
  });
});
