import { describe, expect, it } from 'vitest';
import { formatLeagueCount } from './helpers';

describe('formatLeagueCount', () => {
  it('uses the singular for one league and the plural for any other count', () => {
    expect(formatLeagueCount(1)).toBe('1 league');
    expect(formatLeagueCount(0)).toBe('0 leagues');
    expect(formatLeagueCount(3)).toBe('3 leagues');
  });
});
