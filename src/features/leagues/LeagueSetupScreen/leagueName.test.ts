import { describe, expect, it } from 'vitest';
import { LEAGUE_NAME_INVALID, leagueNameProblem } from './leagueName';

describe('leagueNameProblem', () => {
  it('rejects a name with no letter or number, as slug() does', () => {
    expect(leagueNameProblem('')).toBe(LEAGUE_NAME_INVALID);
    expect(leagueNameProblem('   ')).toBe(LEAGUE_NAME_INVALID);
    expect(leagueNameProblem('!!!')).toBe(LEAGUE_NAME_INVALID);
  });

  it('accepts a valid name, also one that another league uses (Task 160)', () => {
    expect(leagueNameProblem('Coastal Premier')).toBeNull();
  });
});
