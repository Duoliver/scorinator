import { describe, expect, it } from 'vitest';
import { ROUTES, seasonLeagueDetailPath, seasonLeagueNewPath } from './routes';

describe('the Season league routes (Task 216 choice 8)', () => {
  it('has a route for a new Season league and for a Season league', () => {
    expect(ROUTES.seasonLeagueNew).toBe('/seasons/:uuid/leagues/new');
    expect(ROUTES.seasonLeagueDetail).toBe('/seasons/:uuid/leagues/:leagueUuid');
  });

  it('builds the real paths from the UUIDs', () => {
    expect(seasonLeagueNewPath('s-1')).toBe('/seasons/s-1/leagues/new');
    expect(seasonLeagueDetailPath('s-1', 'l-2')).toBe('/seasons/s-1/leagues/l-2');
  });
});
