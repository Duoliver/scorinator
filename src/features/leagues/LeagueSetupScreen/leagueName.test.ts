import { describe, expect, it } from 'vitest';
import {
  LEAGUE_NAME_INVALID,
  LEAGUE_NAME_TAKEN,
  leagueNameProblem,
} from './leagueName';

describe('leagueNameProblem', () => {
  it('rejects a name with no letter or number, as slug() does', () => {
    expect(leagueNameProblem('', [])).toBe(LEAGUE_NAME_INVALID);
    expect(leagueNameProblem('   ', [])).toBe(LEAGUE_NAME_INVALID);
    expect(leagueNameProblem('!!!', [])).toBe(LEAGUE_NAME_INVALID);
  });

  it('rejects a name whose slug another league already uses', () => {
    expect(leagueNameProblem('Coastal Premier', ['coastal-premier'])).toBe(
      LEAGUE_NAME_TAKEN
    );
  });

  it('rejects a different spelling with the same slug', () => {
    expect(leagueNameProblem('  coastal premier!', ['coastal-premier'])).toBe(
      LEAGUE_NAME_TAKEN
    );
  });

  it('accepts a valid name that no league uses', () => {
    expect(leagueNameProblem('Coastal Premier', [])).toBeNull();
    expect(leagueNameProblem('Coastal Premier', ['harbour-cup'])).toBeNull();
  });
});
